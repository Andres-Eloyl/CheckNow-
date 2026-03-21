"""
CheckNow! — Checkout Router
Handles checkout summaries, BCV exchange rate retrieval, and payment processing.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
import uuid
from typing import List
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import get_restaurant_id, get_current_staff
from app.websockets.manager import ws_manager
from app.core.security import encrypt_reference
from app.services.bcv import get_current_rate

from app.models.session import TableSession, SessionUser, SessionStatus
from app.models.table import Table
from app.models.order import OrderItem, OrderStatus
from app.models.split import SplitAssignment
from app.models.payment import Payment, PaymentStatus, PaymentCurrency, PaymentMethod
from app.models.loyalty import LoyaltyAccount
from app.models.restaurant import RestaurantConfig

from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentVerify,
    PaymentReject,
    CheckoutSummary,
    ExchangeRateResponse,
)

router = APIRouter(tags=["checkout"])


async def get_valid_context(token: str, ref_user_id: str, db: AsyncSession) -> tuple[TableSession, SessionUser]:
    """Helper to get and validate session and user."""
    result = await db.execute(
        select(TableSession)
        .where(
            TableSession.token == token,
            TableSession.status.in_([SessionStatus.OPEN, SessionStatus.IN_PROGRESS]),
        )
    )
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Active session not found")

    result_user = await db.execute(
        select(SessionUser).where(
            SessionUser.id == ref_user_id,
            SessionUser.session_id == db_session.id
        )
    )
    user = result_user.scalars().first()
    if not user:
        raise HTTPException(status_code=403, detail="Invalid session user")

    return db_session, user


# ──────────────────────────────────────────────
# Public Checkout Endpoints
# ──────────────────────────────────────────────

@router.get("/api/{slug}/public/exchange-rate", response_model=ExchangeRateResponse)
async def get_exchange_rate(
    slug: str, # For routing scope
    db: AsyncSession = Depends(get_db)
):
    """Get the current USD to VES exchange rate (from BCV)."""
    rate = await get_current_rate(db)
    return ExchangeRateResponse(
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        usd_to_ves=rate,
        fetched_at=datetime.now(timezone.utc)
    )


@router.get("/api/{slug}/sessions/{token}/checkout/summary", response_model=CheckoutSummary)
async def get_checkout_summary(
    slug: str,
    token: str,
    x_session_user_id: str = Header(...),
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Calculates the total amount owed by a specific user.
    Includes their own items and accepted split assignments.
    """
    db_session, user = await get_valid_context(token, x_session_user_id, db)

    # 1. Sum up items exclusively owned by the user (no split assignments attached)
    # This requires checking if an item has an assignment. If it does, ignore it here, 
    # we'll calculate it in step 2.
    result_exclusive = await db.execute(
        select(OrderItem)
        .outerjoin(SplitAssignment, OrderItem.id == SplitAssignment.order_item_id)
        .where(
            OrderItem.session_id == db_session.id,
            OrderItem.session_user_id == user.id,
            OrderItem.status.not_in([OrderStatus.PENDING, OrderStatus.CANCELLED]),
            SplitAssignment.id == None # no splits
        )
    )
    exclusive_items = result_exclusive.scalars().all()
    subtotal_exclusive = sum(float(item.unit_price * item.quantity) for item in exclusive_items)

    # 2. Sum up accepted split assignments for the user
    # This covers pieces of items the user is paying for
    result_splits = await db.execute(
        select(SplitAssignment).where(
            SplitAssignment.session_user_id == user.id,
            SplitAssignment.accepted == True
        )
    )
    split_items = result_splits.scalars().all()
    subtotal_splits = sum(float(split.amount_owed) for split in split_items)

    # Total Base
    subtotal = subtotal_exclusive + subtotal_splits

    # Tax & Service Charge handling (Mock values for MVP, should be loaded from Restaurant settings)
    tax_rate = 0.16 # 16% IVA
    service_charge_rate = 0.00 # e.g. 10%

    tax = round(float(subtotal * tax_rate), 2)
    service_charge = round(float(subtotal * service_charge_rate), 2)
    total_base = round(float(subtotal + tax + service_charge), 2)

    return CheckoutSummary(
        user_id=str(user.id),
        alias=user.alias,
        subtotal=round(float(subtotal), 2),
        tax=tax,
        service_charge=service_charge,
        suggested_tip_10=round(float(subtotal * 0.10), 2),
        suggested_tip_15=round(float(subtotal * 0.15), 2),
        suggested_tip_20=round(float(subtotal * 0.20), 2),
        total_before_tip=total_base
    )


@router.post("/api/{slug}/sessions/{token}/checkout/pay", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def submit_payment(
    slug: str,
    token: str,
    payment_in: PaymentCreate,
    x_session_user_id: str = Header(...),
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a payment for verification by the staff.
    """
    db_session, user = await get_valid_context(token, x_session_user_id, db)

    try:
        method = PaymentMethod(payment_in.method)
        currency = PaymentCurrency(payment_in.currency)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payment method or currency")

    # If it's Pago Movil or Zelle, a reference code is usually required
    if method in (PaymentMethod.PAGO_MOVIL, PaymentMethod.ZELLE) and not payment_in.reference_code:
        raise HTTPException(status_code=400, detail="Reference code is required for electronic transfers")

    # Encrypt reference code
    encrypted_ref = encrypt_reference(payment_in.reference_code) if payment_in.reference_code else None

    # Fetch table to broadcast to staff
    table_result = await db.execute(select(Table).where(Table.id == db_session.table_id))
    table = table_result.scalars().first()

    payment = Payment(
        session_id=db_session.id,
        session_user_id=user.id,
        amount_usd=payment_in.amount_usd,
        amount_local=payment_in.amount_local,
        currency=currency,
        exchange_rate=payment_in.exchange_rate,
        method=method,
        tip_amount=payment_in.tip_amount,
        reference_code_enc=encrypted_ref,
        status=PaymentStatus.PENDING
    )
    
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    # Broadcast to staff dashboard
    await ws_manager.broadcast(
        f"ws:dashboard:{slug}",
        {
            "event": "payment_pending",
            "data": {
                "payment_id": str(payment.id),
                "table": table.number,
                "user_alias": user.alias,
                "amount": payment.amount_usd,
                "currency": payment.currency.value,
                "method": payment.method.value,
                "tip": payment.tip_amount
            }
        }
    )

    return payment


# ──────────────────────────────────────────────
# Staff Verification Endpoints
# ──────────────────────────────────────────────

@router.post("/api/{slug}/payments/{payment_id}/verify", response_model=PaymentResponse)
async def verify_payment(
    slug: str,
    payment_id: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Staff approves a pending payment."""
    result = await db.execute(
        select(Payment, TableSession, SessionUser)
        .join(TableSession, Payment.session_id == TableSession.id)
        .join(SessionUser, Payment.session_user_id == SessionUser.id)
        .join(Table, TableSession.table_id == Table.id)
        .where(
            Payment.id == payment_id,
            Table.restaurant_id == restaurant_id
        )
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    payment, db_session, user = row
    
    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Payment is not pending verification")

    # Verify
    payment.status = PaymentStatus.VERIFIED
    payment.verified_by = current_user["sub"]
    payment.verified_at = datetime.now(timezone.utc)
    
    # Update Session financial totals
    # (amount_usd does NOT include tip, tip is separate field)
    db_session.tax_collected += 0 # In a real implementation, extract tax portion
    db_session.tip_collected += payment.tip_amount
    
    # ─── ADD LOYALTY POINTS ───
    if user.loyalty_account_id:
        # Get restaurant config for reward rate
        config_res = await db.execute(
            select(RestaurantConfig).where(RestaurantConfig.restaurant_id == restaurant_id)
        )
        config = config_res.scalars().first()
        if config and config.loyalty_enabled:
            acc_res = await db.execute(
                select(LoyaltyAccount).where(LoyaltyAccount.id == user.loyalty_account_id)
            )
            account = acc_res.scalars().first()
            if account:
                # Calculate points based on amount_usd and config rate
                points_earned = int(float(payment.amount_usd) * config.points_reward_rate)
                if points_earned > 0:
                    account.points_balance += points_earned
                    account.total_spent_usd += payment.amount_usd
                    account.visit_count += 1
                    account.last_active = datetime.now(timezone.utc)
                    db.add(account)
    # ──────────────────────────
    
    await db.commit()
    await db.refresh(payment)

    # Let the user know their payment was approved
    await ws_manager.broadcast(
        f"ws:session:{db_session.token}",
        {
            "event": "payment_verified",
            "data": {
                "user_alias": user.alias,
                "payment_id": str(payment.id)
            }
        }
    )

    return payment


@router.post("/api/{slug}/payments/{payment_id}/reject", response_model=PaymentResponse)
async def reject_payment(
    slug: str,
    payment_id: str,
    reject_in: PaymentReject,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Staff rejects a pending payment (e.g., Zelle didn't arrive)."""
    result = await db.execute(
        select(Payment, TableSession, SessionUser)
        .join(TableSession, Payment.session_id == TableSession.id)
        .join(SessionUser, Payment.session_user_id == SessionUser.id)
        .join(Table, TableSession.table_id == Table.id)
        .where(
            Payment.id == payment_id,
            Table.restaurant_id == restaurant_id
        )
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    payment, db_session, user = row
    
    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Payment is not pending")

    payment.status = PaymentStatus.REJECTED
    payment.rejected_reason = reject_in.reason
    payment.verified_by = current_user["sub"]
    payment.verified_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(payment)

    # Let the user know
    await ws_manager.broadcast(
        f"ws:session:{db_session.token}",
        {
            "event": "payment_rejected",
            "data": {
                "user_alias": user.alias,
                "payment_id": str(payment.id),
                "reason":  reject_in.reason
            }
        }
    )

    return payment
