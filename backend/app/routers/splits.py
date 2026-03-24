"""
CheckNow! — Splits Router
Handles the engine for splitting order items equally, by custom fraction, or paying for others.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
import uuid
from typing import List
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.dependencies import get_restaurant_id
from app.websockets.manager import ws_manager
from app.models.session import TableSession, SessionUser, SessionStatus
from app.models.order import OrderItem, OrderStatus
from app.models.split import SplitAssignment
from app.models.menu import MenuItem
from app.schemas.split import SplitCreate, SplitResponse, PayForRequest

router = APIRouter(tags=["split"])


async def get_valid_context(token: str, ref_user_id: str, db: AsyncSession) -> tuple[TableSession, SessionUser]:
    """Helper to get and validate session and user."""
    from app.models.table import Table
    result = await db.execute(
        select(TableSession)
        .join(Table, TableSession.table_id == Table.id)
        .where(
            or_(TableSession.token == token, TableSession.table_id == token),
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


@router.post("/api/{slug}/sessions/{token}/splits", response_model=List[SplitResponse])
async def create_split(
    slug: str,
    token: str,
    split_in: SplitCreate,
    x_session_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Propose splitting an order item among multiple users.
    If fractions are not provided, it is split equally.
    """
    db_session, user = await get_valid_context(token, x_session_user_id, db)

    # 1. Verify the order item
    result_order = await db.execute(
        select(OrderItem, MenuItem)
        .join(MenuItem, OrderItem.menu_item_id == MenuItem.id)
        .where(
            OrderItem.id == split_in.order_item_id,
            OrderItem.session_id == db_session.id
        )
    )
    row = result_order.first()
    if not row:
        raise HTTPException(status_code=404, detail="Order item not found")
        
    order_item, menu_item = row

    if order_item.status not in (OrderStatus.SENT, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED):
        raise HTTPException(status_code=400, detail="Cannot split a pending or cancelled item")
        
    if order_item.is_locked:
        raise HTTPException(status_code=400, detail="Item is already locked in another split or payment process")

    # 2. Verify all participants exist in the session
    result_users = await db.execute(
        select(SessionUser).where(
            SessionUser.id.in_(split_in.participants),
            SessionUser.session_id == db_session.id
        )
    )
    valid_participants = result_users.scalars().all()
    if len(valid_participants) != len(split_in.participants):
        raise HTTPException(status_code=400, detail="One or more participants are invalid")

    # 3. Calculate fractions and amounts
    # If the item is shared (like a pizza), unit_price is the full item price.
    total_value = float(order_item.unit_price * order_item.quantity)
    num_participants = len(split_in.participants)
    
    fractions = split_in.fractions
    if not fractions:
        # Equal split
        f = 1.0 / num_participants
        fractions = [f] * num_participants
    else:
        # Custom fractions: verify they sum to ~1.0
        if len(fractions) != num_participants:
            raise HTTPException(status_code=400, detail="Fractions count must match participants count")
        
        sum_f = sum(fractions)
        if not (0.99 <= sum_f <= 1.01):
            raise HTTPException(status_code=400, detail="Fractions must sum up to 1.0")

    # 4. Create split assignments
    # Lock the item so it can't be modified or split again while pending
    order_item.is_locked = True
    
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5) # Invitations expire in 5 min
    
    new_assignments = []
    
    for i, p_id in enumerate(split_in.participants):
        fraction = fractions[i]
        amount_owed = round(total_value * fraction, 2)
        
        # Auto-accept if the participant is the one requesting it
        is_requester = (str(p_id) == str(user.id))
        
        assignment = SplitAssignment(
            order_item_id=order_item.id,
            requested_by=user.id,
            session_user_id=p_id,
            fraction=fraction,
            amount_owed=amount_owed,
            accepted=is_requester,
            expires_at=expires_at
        )
        db.add(assignment)
        new_assignments.append(assignment)

    await db.commit()
    
    response_data = []
    for a in new_assignments:
        await db.refresh(a)
        data = a.__dict__.copy()
        data["order_item_name"] = menu_item.name
        # Format expires_at for pydantic
        data["expires_at"] = a.expires_at.isoformat()
        response_data.append(data)

    # 5. Broadcast split proposal to session
    await ws_manager.broadcast(
        f"ws:session:{token}",
        {
            "event": "split_proposed",
            "data": {
                "order_item_id": str(order_item.id),
                "item_name": menu_item.name,
                "requested_by_alias": user.alias,
                "assignments": [
                    {"user_id": str(a.session_user_id), "amount": str(a.amount_owed)}
                    for a in new_assignments if not a.accepted
                ]
            }
        }
    )

    return response_data


@router.post("/api/{slug}/sessions/{token}/splits/{assignment_id}/accept", response_model=SplitResponse)
async def accept_split(
    slug: str,
    token: str,
    assignment_id: str,
    x_session_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Accept a proposed split fraction."""
    db_session, user = await get_valid_context(token, x_session_user_id, db)

    # Note: We don't join menu_item here to keep it simple, but we need it for response
    result = await db.execute(
        select(SplitAssignment, MenuItem.name)
        .join(OrderItem, SplitAssignment.order_item_id == OrderItem.id)
        .join(MenuItem, OrderItem.menu_item_id == MenuItem.id)
        .where(
            SplitAssignment.id == assignment_id,
            SplitAssignment.session_user_id == user.id
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Split assignment not found")
        
    assignment, item_name = row

    if assignment.accepted:
        raise HTTPException(status_code=400, detail="Assignment already accepted")
        
    if assignment.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Split invitation expired")

    assignment.accepted = True
    await db.commit()
    await db.refresh(assignment)
    
    # Broadcast acceptance
    await ws_manager.broadcast(
        f"ws:session:{token}",
        {
            "event": "split_accepted",
            "data": {
                "user_alias": user.alias,
                "order_item_id": str(assignment.order_item_id)
            }
        }
    )

    data = assignment.__dict__.copy()
    data["order_item_name"] = item_name
    data["expires_at"] = assignment.expires_at.isoformat()
    return data


@router.post("/api/{slug}/sessions/{token}/pay-for", response_model=SplitResponse)
async def pay_for_someone(
    slug: str,
    token: str,
    pay_req: PayForRequest,
    x_session_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Mode 'Yo Invito': One user decides to cover the cost of another user's item 
    or unassigned item.
    """
    db_session, user = await get_valid_context(token, x_session_user_id, db)

    # 1. Find the item
    result_order = await db.execute(
        select(OrderItem, MenuItem)
        .join(MenuItem, OrderItem.menu_item_id == MenuItem.id)
        .where(
            OrderItem.id == pay_req.order_item_id,
            OrderItem.session_id == db_session.id
        )
    )
    row = result_order.first()
    if not row:
        raise HTTPException(status_code=404, detail="Order item not found")
        
    order_item, menu_item = row
    
    if order_item.status not in (OrderStatus.SENT, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED):
        raise HTTPException(status_code=400, detail="Cannot pay for a pending or cancelled item")

    # 2. Check if the item already has split assignments
    # For a full "yo invito", we assume we are taking over 100% of the item
    # If the item was already split, we can't easily override it here without complex logic.
    # In a real scenario we'd transfer specific assignments. For MVP, we only allow 
    # paying for "whole" items that belong to someone else.
    if order_item.is_locked:
        raise HTTPException(status_code=400, detail="Item is already handled by a split process")
        
    # Check if beneficiary exists
    result_beneficiary = await db.execute(
        select(SessionUser).where(
            SessionUser.id == pay_req.beneficiary_user_id,
            SessionUser.session_id == db_session.id
        )
    )
    ben = result_beneficiary.scalars().first()
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiary user not found in session")

    # 3. Create a 100% assignment targeting the requestor but linked to the item
    # Basically: the requestor owns 100% of the financial burden for this item
    total_value = float(order_item.unit_price * order_item.quantity)
    
    order_item.is_locked = True
    
    assignment = SplitAssignment(
        order_item_id=order_item.id,
        requested_by=ben.id, # The menu item "belonged" to them arguably
        session_user_id=user.id, # The person actually paying
        fraction=1.0,
        amount_owed=total_value,
        accepted=True, # Auto accept since requestor is offering
        expires_at=datetime.now(timezone.utc) + timedelta(days=1)
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    # 4. Broadcast the generosity
    await ws_manager.broadcast(
        f"ws:session:{token}",
        {
            "event": "yo_invito",
            "data": {
                "payer_alias": user.alias,
                "beneficiary_alias": ben.alias,
                "item_name": menu_item.name
            }
        }
    )

    data = assignment.__dict__.copy()
    data["order_item_name"] = menu_item.name
    data["expires_at"] = assignment.expires_at.isoformat()
    return data
