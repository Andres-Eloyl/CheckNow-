"""
CheckNow! — Analytics Router
Módulo de Business Intelligence para dueños de restaurantes.
Consultas sobre ventas, ítems, horas pico y métodos de pago.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date, Integer, extract
from datetime import datetime, timezone, timedelta, date
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_restaurant, get_restaurant_id
from app.models.payment import Payment, PaymentStatus
from app.models.order import OrderItem, OrderStatus
from app.models.session import TableSession, SessionStatus
from app.models.table import Table
from app.models.menu import MenuItem
from app.schemas.analytics import (
    SalesByDayItem, SalesByDayResponse,
    TopMenuItem, TopItemsResponse,
    PeakHourItem, PeakHoursResponse,
    PaymentMethodStat, PaymentMethodsResponse,
    DashboardSummary,
)

router = APIRouter(tags=["Analytics"])


# ──────────────────────────────────────────────
# Helper: get tables for this restaurant
# ──────────────────────────────────────────────

def _restaurant_sessions_filter(restaurant_id: str):
    """Subquery: session IDs belonging to this restaurant's tables."""
    return (
        select(TableSession.id)
        .join(Table, TableSession.table_id == Table.id)
        .where(Table.restaurant_id == restaurant_id)
    )


# ──────────────────────────────────────────────
# Dashboard Summary
# ──────────────────────────────────────────────

@router.get("/api/{slug}/analytics/dashboard", response_model=DashboardSummary)
async def get_dashboard_summary(
    slug: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Resumen ejecutivo del dashboard — KPIs de hoy y del mes."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    session_ids_subq = _restaurant_sessions_filter(restaurant_id).scalar_subquery()

    # --- Today's stats ---
    today_result = await db.execute(
        select(
            func.coalesce(func.sum(Payment.amount_usd), 0).label("revenue"),
            func.count(Payment.id).label("count"),
        )
        .where(
            Payment.session_id.in_(session_ids_subq),
            Payment.status == PaymentStatus.VERIFIED,
            Payment.created_at >= today_start,
        )
    )
    today = today_result.first()
    today_revenue = float(today.revenue) if today else 0.0
    today_orders = int(today.count) if today else 0

    # --- Month stats ---
    month_result = await db.execute(
        select(
            func.coalesce(func.sum(Payment.amount_usd), 0).label("revenue"),
            func.count(Payment.id).label("count"),
            func.coalesce(func.sum(Payment.tip_amount), 0).label("tips"),
        )
        .where(
            Payment.session_id.in_(session_ids_subq),
            Payment.status == PaymentStatus.VERIFIED,
            Payment.created_at >= month_start,
        )
    )
    month = month_result.first()
    month_revenue = float(month.revenue) if month else 0.0
    month_orders = int(month.count) if month else 0
    month_tips = float(month.tips) if month else 0.0

    # --- Active sessions ---
    active_result = await db.execute(
        select(func.count(TableSession.id))
        .join(Table, TableSession.table_id == Table.id)
        .where(
            Table.restaurant_id == restaurant_id,
            TableSession.status.in_([SessionStatus.OPEN, SessionStatus.IN_PROGRESS]),
        )
    )
    active_sessions = active_result.scalar() or 0

    return DashboardSummary(
        total_revenue_today=round(today_revenue, 2),
        total_orders_today=today_orders,
        avg_ticket_today=round(today_revenue / today_orders, 2) if today_orders > 0 else 0.0,
        active_sessions=active_sessions,
        total_revenue_month=round(month_revenue, 2),
        total_orders_month=month_orders,
        avg_ticket_month=round(month_revenue / month_orders, 2) if month_orders > 0 else 0.0,
        tips_collected_month=round(month_tips, 2),
    )


# ──────────────────────────────────────────────
# Sales by Day
# ──────────────────────────────────────────────

@router.get("/api/{slug}/analytics/sales-by-day", response_model=SalesByDayResponse)
async def get_sales_by_day(
    slug: str,
    days: int = Query(default=30, ge=1, le=365, description="Número de días hacia atrás"),
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Ventas agrupadas por día (últimos N días)."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)

    session_ids_subq = _restaurant_sessions_filter(restaurant_id).scalar_subquery()

    result = await db.execute(
        select(
            cast(Payment.created_at, Date).label("day"),
            func.sum(Payment.amount_usd).label("total"),
            func.count(Payment.id).label("count"),
        )
        .where(
            Payment.session_id.in_(session_ids_subq),
            Payment.status == PaymentStatus.VERIFIED,
            Payment.created_at >= start_date,
        )
        .group_by(cast(Payment.created_at, Date))
        .order_by(cast(Payment.created_at, Date))
    )
    rows = result.all()

    items = []
    grand_total = 0.0
    grand_orders = 0
    for row in rows:
        total = float(row.total)
        count = int(row.count)
        items.append(SalesByDayItem(
            date=str(row.day),
            total_usd=round(total, 2),
            order_count=count,
            avg_ticket=round(total / count, 2) if count > 0 else 0.0,
        ))
        grand_total += total
        grand_orders += count

    return SalesByDayResponse(
        period_start=str(start_date.date()),
        period_end=str(now.date()),
        days=items,
        grand_total=round(grand_total, 2),
        grand_orders=grand_orders,
    )


# ──────────────────────────────────────────────
# Top Menu Items
# ──────────────────────────────────────────────

@router.get("/api/{slug}/analytics/top-items", response_model=TopItemsResponse)
async def get_top_items(
    slug: str,
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=10, ge=1, le=50),
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Top ítems más vendidos (por cantidad)."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)

    session_ids_subq = _restaurant_sessions_filter(restaurant_id).scalar_subquery()

    result = await db.execute(
        select(
            OrderItem.menu_item_id,
            MenuItem.name.label("item_name"),
            func.sum(OrderItem.quantity).label("qty"),
            func.sum(OrderItem.unit_price * OrderItem.quantity).label("revenue"),
        )
        .join(MenuItem, OrderItem.menu_item_id == MenuItem.id)
        .where(
            OrderItem.session_id.in_(session_ids_subq),
            OrderItem.status.not_in([OrderStatus.PENDING, OrderStatus.CANCELLED]),
            OrderItem.created_at >= start_date,
        )
        .group_by(OrderItem.menu_item_id, MenuItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )
    rows = result.all()

    items = [
        TopMenuItem(
            menu_item_id=str(row.menu_item_id),
            name=row.item_name or "Sin nombre",
            quantity_sold=int(row.qty),
            revenue_usd=round(float(row.revenue), 2),
        )
        for row in rows
    ]

    return TopItemsResponse(
        period_start=str(start_date.date()),
        period_end=str(now.date()),
        items=items,
    )


# ──────────────────────────────────────────────
# Peak Hours
# ──────────────────────────────────────────────

@router.get("/api/{slug}/analytics/peak-hours", response_model=PeakHoursResponse)
async def get_peak_hours(
    slug: str,
    days: int = Query(default=30, ge=1, le=365),
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Distribución de actividad por hora del día (órdenes confirmadas)."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)

    session_ids_subq = _restaurant_sessions_filter(restaurant_id).scalar_subquery()

    result = await db.execute(
        select(
            extract("hour", OrderItem.created_at).label("hour"),
            func.count(OrderItem.id).label("count"),
            func.sum(OrderItem.unit_price * OrderItem.quantity).label("revenue"),
        )
        .where(
            OrderItem.session_id.in_(session_ids_subq),
            OrderItem.status.not_in([OrderStatus.PENDING, OrderStatus.CANCELLED]),
            OrderItem.created_at >= start_date,
        )
        .group_by(extract("hour", OrderItem.created_at))
        .order_by(extract("hour", OrderItem.created_at))
    )
    rows = result.all()

    hours = []
    busiest_hour = 0
    max_count = 0
    for row in rows:
        h = int(row.hour)
        count = int(row.count)
        hours.append(PeakHourItem(
            hour=h,
            order_count=count,
            revenue_usd=round(float(row.revenue), 2),
        ))
        if count > max_count:
            max_count = count
            busiest_hour = h

    return PeakHoursResponse(
        period_start=str(start_date.date()),
        period_end=str(now.date()),
        hours=hours,
        busiest_hour=busiest_hour,
    )


# ──────────────────────────────────────────────
# Payment Methods Breakdown
# ──────────────────────────────────────────────

@router.get("/api/{slug}/analytics/payment-methods", response_model=PaymentMethodsResponse)
async def get_payment_methods_breakdown(
    slug: str,
    days: int = Query(default=30, ge=1, le=365),
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Distribución de pagos por método (Pago Móvil, Zelle, Efectivo, etc.)."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)

    session_ids_subq = _restaurant_sessions_filter(restaurant_id).scalar_subquery()

    result = await db.execute(
        select(
            Payment.method.label("method"),
            func.count(Payment.id).label("count"),
            func.sum(Payment.amount_usd).label("total"),
        )
        .where(
            Payment.session_id.in_(session_ids_subq),
            Payment.status == PaymentStatus.VERIFIED,
            Payment.created_at >= start_date,
        )
        .group_by(Payment.method)
        .order_by(func.sum(Payment.amount_usd).desc())
    )
    rows = result.all()

    grand_total = sum(float(r.total) for r in rows) if rows else 0.0

    methods = [
        PaymentMethodStat(
            method=row.method.value if hasattr(row.method, "value") else str(row.method),
            count=int(row.count),
            total_usd=round(float(row.total), 2),
            percentage=round(float(row.total) / grand_total * 100, 1) if grand_total > 0 else 0.0,
        )
        for row in rows
    ]

    return PaymentMethodsResponse(
        period_start=str(start_date.date()),
        period_end=str(now.date()),
        methods=methods,
    )
