"""
CheckNow! — Orders Router
Handles the collaborative cart and order lifecycle.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import get_restaurant_id, get_current_staff
from app.websockets.manager import ws_manager
from app.models.session import TableSession, SessionUser, SessionStatus
from app.models.table import Table
from app.models.menu import MenuItem
from app.models.order import OrderItem, OrderStatus
from app.schemas.order import (
    OrderItemCreate,
    OrderItemResponse,
    OrderStatusUpdate,
)

router = APIRouter(tags=["orders"])


async def get_valid_session(token: str, restaurant_id: str, db: AsyncSession) -> TableSession:
    """Helper to get and validate a session."""
    result = await db.execute(
        select(TableSession)
        .join(Table, TableSession.table_id == Table.id)
        .where(
            or_(TableSession.token == token, TableSession.table_id == token),
            Table.restaurant_id == restaurant_id,
            TableSession.status.in_([SessionStatus.OPEN, SessionStatus.IN_PROGRESS]),
        )
    )
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Active session not found")
    return db_session


async def get_valid_session_user(session_user_id: str, session_id: uuid.UUID, db: AsyncSession) -> SessionUser:
    """Helper to get and validate the user making the request."""
    result = await db.execute(
        select(SessionUser).where(
            SessionUser.id == session_user_id,
            SessionUser.session_id == session_id
        )
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=403, detail="Invalid session user")
    return user


# ──────────────────────────────────────────────
# Comensal Endpoints
# ──────────────────────────────────────────────

@router.post("/api/{slug}/sessions/{token}/orders", response_model=OrderItemResponse, status_code=status.HTTP_201_CREATED)
async def add_order_item(
    slug: str,
    token: str,
    order_in: OrderItemCreate,
    x_session_user_id: str = Header(..., description="ID of the session user ordering"),
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """Add an item to the collaborative cart (Comensal)."""
    db_session = await get_valid_session(token, restaurant_id, db)
    user = await get_valid_session_user(x_session_user_id, db_session.id, db)

    # Verify menu item exists and is available
    result = await db.execute(
        select(MenuItem).where(
            MenuItem.id == order_in.menu_item_id,
            MenuItem.is_available == True
        )
    )
    menu_item = result.scalars().first()
    if not menu_item:
        raise HTTPException(status_code=400, detail="Menu item not available")

    # Create the order item
    order = OrderItem(
        session_id=db_session.id,
        session_user_id=user.id,
        menu_item_id=menu_item.id,
        quantity=order_in.quantity,
        unit_price=menu_item.price_usd,
        modifiers=order_in.modifiers or [],
        notes=order_in.notes,
        status=OrderStatus.PENDING,
        is_shared=order_in.is_shared,
    )
    db.add(order)
    
    # Update session total (optimistic total, doesn't account for taxes/tips yet)
    db_session.total_amount += (menu_item.price_usd * order_in.quantity)
    
    await db.commit()
    await db.refresh(order)

    # Broadcast to session (cart update) — use table_id as channel key
    await ws_manager.broadcast(
        f"ws:session:{str(db_session.table_id)}",
        {
            "event": "item_added",
            "data": {
                "user": user.alias,
                "item": menu_item.name,
                "qty": order.quantity,
                "shared": order.is_shared,
            }
        }
    )

    # Enrich response
    response_data = order.__dict__.copy()
    response_data["session_user_alias"] = user.alias
    response_data["menu_item_name"] = menu_item.name
    return response_data


@router.delete("/api/{slug}/sessions/{token}/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_order_item(
    slug: str,
    token: str,
    order_id: str,
    x_session_user_id: str = Header(...),
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """Remove an item from the cart (Comensal). Only allowed if status is PENDING."""
    db_session = await get_valid_session(token, restaurant_id, db)
    user = await get_valid_session_user(x_session_user_id, db_session.id, db)

    result = await db.execute(
        select(OrderItem).where(
            OrderItem.id == order_id,
            OrderItem.session_id == db_session.id,
        )
    )
    order = result.scalars().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order item not found")

    if str(order.session_user_id) != user.id:
        raise HTTPException(status_code=403, detail="Cannot remove someone else's item")

    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cannot remove item that has already been sent")

    if order.is_locked:
        raise HTTPException(status_code=400, detail="Item is locked due to an active payment process")

    # Subtract from total
    db_session.total_amount -= (order.unit_price * order.quantity)
    
    await db.delete(order)
    await db.commit()

    # Broadcast to session — use table_id as channel key
    await ws_manager.broadcast(
        f"ws:session:{str(db_session.table_id)}",
        {
            "event": "item_removed",
            "data": {
                "user": user.alias,
                "order_item_id": order_id
            }
        }
    )
    return None


@router.get("/api/{slug}/sessions/{token}/orders", response_model=List[OrderItemResponse])
async def get_session_orders(
    slug: str,
    token: str,
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """Get all orders for the table."""
    db_session = await get_valid_session(token, restaurant_id, db)

    result = await db.execute(
        select(OrderItem, SessionUser.alias, MenuItem.name)
        .join(SessionUser, OrderItem.session_user_id == SessionUser.id)
        .join(MenuItem, OrderItem.menu_item_id == MenuItem.id)
        .where(OrderItem.session_id == db_session.id)
        .order_by(OrderItem.created_at)
    )
    
    orders = []
    for order, alias, item_name in result.all():
        data = order.__dict__.copy()
        data["session_user_alias"] = alias
        data["menu_item_name"] = item_name
        orders.append(data)
        
    return orders


@router.post("/api/{slug}/sessions/{token}/orders/confirm")
async def confirm_orders(
    slug: str,
    token: str,
    x_session_user_id: str = Header(...),
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """Confirm all pending orders and send them to the kitchen/bar."""
    db_session = await get_valid_session(token, restaurant_id, db)
    user = await get_valid_session_user(x_session_user_id, db_session.id, db)

    # Find pending orders
    result = await db.execute(
        select(OrderItem)
        .where(OrderItem.session_id == db_session.id, OrderItem.status == OrderStatus.PENDING)
    )
    pending_orders = result.scalars().all()

    if not pending_orders:
        return {"message": "No pending orders to confirm", "items_sent": 0}

    now = datetime.now(timezone.utc)
    for order in pending_orders:
        order.status = OrderStatus.SENT
        order.sent_at = now
        
    await db.commit()

    # Get table for dashboard event
    table_result = await db.execute(select(Table).where(Table.id == db_session.table_id))
    table = table_result.scalars().first()

    # WS Notification for Comensales — use table_id as channel key
    await ws_manager.broadcast(
        f"ws:session:{str(db_session.table_id)}",
        {
            "event": "order_confirmed",
            "data": {
                "items_sent": len(pending_orders),
                "message": f"Pedido enviado a cocina por {user.alias}"
            }
        }
    )

    # WS Notification for Staff Dashboard — enriched with names for instant display
    kitchen_items = [
        {
            "id": str(o.id),
            "menu_item_id": str(o.menu_item_id),
            "menu_item_name": o.menu_item.name if o.menu_item else "Item",
            "qty": o.quantity,
            "modifiers": o.modifiers,
            "notes": o.notes,
        }
        for o in pending_orders
    ]
    
    await ws_manager.broadcast(
        f"ws:dashboard:{slug}",
        {
            "event": "new_order",
            "data": {
                "table": table.number if table else "?",
                "table_number": table.number if table else "?",
                "items": kitchen_items,
                "user_alias": user.alias,
            }
        }
    )

    return {"message": "Orders sent successfully", "items_sent": len(pending_orders)}


# ──────────────────────────────────────────────
# Staff Endpoints
# ──────────────────────────────────────────────

@router.patch("/api/{slug}/orders/{order_id}/status", response_model=OrderItemResponse)
async def update_order_status(
    slug: str,
    order_id: str,
    status_update: OrderStatusUpdate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Update order status (Staff only)."""
    # Fetch order, user, item, session, and table to verify restaurant and trigger WS
    result = await db.execute(
        select(OrderItem, TableSession, MenuItem, SessionUser)
        .join(TableSession, OrderItem.session_id == TableSession.id)
        .join(Table, TableSession.table_id == Table.id)
        .join(MenuItem, OrderItem.menu_item_id == MenuItem.id)
        .join(SessionUser, OrderItem.session_user_id == SessionUser.id)
        .where(
            OrderItem.id == order_id,
            Table.restaurant_id == restaurant_id
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Order item not found")

    order, db_session, menu_item, session_user = row

    try:
        new_status = OrderStatus(status_update.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status value")

    order.status = new_status
    now = datetime.now(timezone.utc)
    
    if new_status == OrderStatus.READY:
        order.ready_at = now
    elif new_status == OrderStatus.DELIVERED:
        order.delivered_at = now
        
    await db.commit()
    await db.refresh(order)

    # WS Notification for Comensales — use table_id as channel key
    await ws_manager.broadcast(
        f"ws:session:{str(db_session.table_id)}",
        {
            "event": "order_status",
            "data": {
                "order_id": str(order.id),
                "item": menu_item.name,
                "status": new_status.value
            }
        }
    )
    
    # WS Notification for Dashboard
    await ws_manager.broadcast(
        f"ws:dashboard:{slug}",
        {
            "event": "order_status_changed",
            "data": {
                "order_id": str(order.id),
                "status": new_status.value
            }
        }
    )

    response_data = order.__dict__.copy()
    response_data["session_user_alias"] = session_user.alias
    response_data["menu_item_name"] = menu_item.name
    return response_data

@router.get("/api/{slug}/orders/active", response_model=List[OrderItemResponse])
async def get_active_orders(
    slug: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Get all active orders for staff KDS view."""
    result = await db.execute(
        select(OrderItem, SessionUser.alias, MenuItem.name, Table.number)
        .join(SessionUser, OrderItem.session_user_id == SessionUser.id)
        .join(MenuItem, OrderItem.menu_item_id == MenuItem.id)
        .join(TableSession, OrderItem.session_id == TableSession.id)
        .join(Table, TableSession.table_id == Table.id)
        .where(
            Table.restaurant_id == restaurant_id,
            OrderItem.status.in_([OrderStatus.SENT, OrderStatus.PREPARING, OrderStatus.READY])
        )
        .order_by(OrderItem.sent_at.asc())
    )
    
    orders = []
    for order, alias, item_name, table_number in result.all():
        data = {c.name: getattr(order, c.name) for c in order.__table__.columns}
        data["session_user_alias"] = alias
        data["menu_item_name"] = item_name
        data["table_number"] = str(table_number) if table_number is not None else None
        orders.append(data)
        
    return orders
