"""
CheckNow! — Analytics Schemas
Schemas para el módulo de Business Intelligence.
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class SalesByDayItem(BaseModel):
    """Ventas de un día específico."""
    date: str
    total_usd: float
    order_count: int
    avg_ticket: float


class SalesByDayResponse(BaseModel):
    """Ventas agrupadas por día."""
    period_start: str
    period_end: str
    days: List[SalesByDayItem]
    grand_total: float
    grand_orders: int


class TopMenuItem(BaseModel):
    """Ítem más vendido."""
    menu_item_id: str
    name: str
    quantity_sold: int
    revenue_usd: float


class TopItemsResponse(BaseModel):
    """Top ítems más vendidos."""
    period_start: str
    period_end: str
    items: List[TopMenuItem]


class PeakHourItem(BaseModel):
    """Actividad por hora."""
    hour: int  # 0-23
    order_count: int
    revenue_usd: float


class PeakHoursResponse(BaseModel):
    """Distribución de actividad por hora del día."""
    period_start: str
    period_end: str
    hours: List[PeakHourItem]
    busiest_hour: int


class PaymentMethodStat(BaseModel):
    """Estadística por método de pago."""
    method: str
    count: int
    total_usd: float
    percentage: float


class PaymentMethodsResponse(BaseModel):
    """Distribución de pagos por método."""
    period_start: str
    period_end: str
    methods: List[PaymentMethodStat]


class DashboardSummary(BaseModel):
    """Resumen ejecutivo del dashboard."""
    total_revenue_today: float
    total_orders_today: int
    avg_ticket_today: float
    active_sessions: int
    total_revenue_month: float
    total_orders_month: int
    avg_ticket_month: float
    tips_collected_month: float
