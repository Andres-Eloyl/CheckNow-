"""
CheckNow! — Loyalty Router
Puntos QR para fidelización de comensales.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import hashlib
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import get_restaurant_id, get_current_staff
from app.websockets.manager import ws_manager

from app.models.loyalty import LoyaltyAccount
from app.models.restaurant import RestaurantConfig, Restaurant
from app.models.session import TableSession, SessionUser, SessionStatus
from app.models.payment import Payment, PaymentStatus, PaymentMethod, PaymentCurrency
from app.models.table import Table

from app.schemas.loyalty import (
    LoyaltyCheckRequest,
    LoyaltyAccountResponse,
    LoyaltyRedeemRequest,
    LoyaltyEarnResponse,
    LoyaltyDashboardCustomer,
)

router = APIRouter(tags=["Loyalty"])


def _hash_phone(phone: str) -> str:
    """Hash phone number for privacy."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    return hashlib.sha256(phone.encode("utf-8")).hexdigest()


# ──────────────────────────────────────────────
# Público: Comensales consultan y canjean puntos
# ──────────────────────────────────────────────

@router.post("/api/{slug}/loyalty/check", response_model=LoyaltyAccountResponse)
async def check_loyalty_account(
    slug: str,
    check_in: LoyaltyCheckRequest,
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Consulta o crea (si no existe) la cuenta de lealtad de un comensal con su teléfono.
    """
    # Verificar si el restaurante tiene Loyalty activado
    result = await db.execute(select(RestaurantConfig).where(RestaurantConfig.restaurant_id == restaurant_id))
    config = result.scalars().first()
    if not config or not config.loyalty_enabled:
        raise HTTPException(
            status_code=400,
            detail="El programa de lealtad no está habilitado para este restaurante."
        )

    phone_hash = _hash_phone(check_in.phone_number)

    # Buscar cuenta
    acc_result = await db.execute(
        select(LoyaltyAccount).where(
            LoyaltyAccount.restaurant_id == restaurant_id,
            LoyaltyAccount.phone_hash == phone_hash
        )
    )
    account = acc_result.scalars().first()

    # Crear cuenta si no existe
    if not account:
        account = LoyaltyAccount(
            restaurant_id=restaurant_id,
            phone_hash=phone_hash,
            points_balance=0,
            total_spent_usd=0.0,
            visit_count=0
        )
        db.add(account)
        await db.commit()
        await db.refresh(account)

    return LoyaltyAccountResponse(
        id=str(account.id),
        phone_hash=account.phone_hash,
        points_balance=account.points_balance,
        total_spent_usd=float(account.total_spent_usd),
        visit_count=account.visit_count,
        created_at=account.created_at,
        last_active=account.last_active,
        points_reward_rate=config.points_reward_rate,
        points_redemption_value=float(config.points_redemption_value)
    )


@router.post("/api/{slug}/loyalty/redeem", response_model=LoyaltyAccountResponse)
async def redeem_points(
    slug: str,
    redeem_in: LoyaltyRedeemRequest,
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Canjea X puntos y crea un "Pago Verificado" en la sesión actual
    equivalente al valor de esos puntos. Disminuye el monto a pagar del cliente.
    """
    # 1. Validar configuración
    result_cfg = await db.execute(select(RestaurantConfig).where(RestaurantConfig.restaurant_id == restaurant_id))
    config = result_cfg.scalars().first()
    if not config or not config.loyalty_enabled:
        raise HTTPException(status_code=400, detail="Lealtad no habilitada.")

    # 2. Buscar cuenta de lealtad
    phone_hash = _hash_phone(redeem_in.phone_number)
    acc_result = await db.execute(
        select(LoyaltyAccount).where(
            LoyaltyAccount.restaurant_id == restaurant_id,
            LoyaltyAccount.phone_hash == phone_hash
        )
    )
    account = acc_result.scalars().first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta de lealtad no encontrada.")

    if account.points_balance < redeem_in.points_to_redeem:
        raise HTTPException(
            status_code=400,
            detail=f"Saldo insuficiente. Tienes {account.points_balance} puntos."
        )

    # 3. Validar Sesión
    sess_result = await db.execute(
        select(TableSession)
        .where(
            TableSession.token == redeem_in.session_token,
            TableSession.status.in_([SessionStatus.OPEN, SessionStatus.IN_PROGRESS])
        )
    )
    session = sess_result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada o cerrada.")

    # Buscar al usuario de sesión correspondiente al comensal (simplificado: tomamos el primero activo)
    # En un sistema real, el usuario pasaría su `x-session-user-id` en el header para saber a quién descontarle
    user_res = await db.execute(select(SessionUser).where(SessionUser.session_id == session.id))
    session_user = user_res.scalars().first()
    if not session_user:
        raise HTTPException(status_code=400, detail="No hay usuarios en esta sesión.")

    # 4. Calcular valor en USD
    discount_usd = float(redeem_in.points_to_redeem * float(config.points_redemption_value))

    # 5. Crear pago auto-verificado simulando el descuento
    loyalty_payment = Payment(
        session_id=session.id,
        session_user_id=session_user.id,
        amount_usd=discount_usd,
        amount_local=0.0,
        currency=PaymentCurrency.USD,
        method=PaymentMethod.TARJETA,  # Simulamos Tarjeta
        tip_amount=0.0,
        status=PaymentStatus.VERIFIED,
        verified_at=datetime.now(timezone.utc),
        ocr_extracted={"is_loyalty": True, "points_redeemed": redeem_in.points_to_redeem}
    )
    db.add(loyalty_payment)

    # 6. Descontar puntos y actualizar last_active
    account.points_balance -= redeem_in.points_to_redeem
    account.last_active = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(account)

    # Broadcast del pago (descuento) a la mesa
    await ws_manager.broadcast(
        f"ws:session:{str(session.table_id)}",
        {
            "event": "payment_verified",
            "data": {
                "user_alias": session_user.alias,
                "payment_id": str(loyalty_payment.id),
                "is_loyalty": True,
                "points_redeemed": redeem_in.points_to_redeem
            }
        }
    )

    return LoyaltyAccountResponse(
        id=str(account.id),
        phone_hash=account.phone_hash,
        points_balance=account.points_balance,
        total_spent_usd=float(account.total_spent_usd),
        visit_count=account.visit_count,
        created_at=account.created_at,
        last_active=account.last_active,
        points_reward_rate=config.points_reward_rate,
        points_redemption_value=float(config.points_redemption_value)
    )


# ──────────────────────────────────────────────
# Staff: Listado de clientes Top
# ──────────────────────────────────────────────

@router.get("/api/{slug}/loyalty/customers")
async def get_top_customers(
    slug: str,
    limit: int = 10,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene los clientes con mayor puntaje/gasto para el dashboard admin.
    """
    result = await db.execute(
        select(LoyaltyAccount)
        .where(LoyaltyAccount.restaurant_id == restaurant_id)
        .order_by(LoyaltyAccount.total_spent_usd.desc())
        .limit(limit)
    )
    accounts = result.scalars().all()

    return [
        {
            "phone_hash_short": acc.phone_hash[:8] + "...",
            "points_balance": acc.points_balance,
            "total_spent_usd": float(acc.total_spent_usd),
            "visit_count": acc.visit_count,
            "last_active": acc.last_active
        }
        for acc in accounts
    ]
