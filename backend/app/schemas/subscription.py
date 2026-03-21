"""
CheckNow! — Subscription Schemas
Schemas for restaurant owners to view their plan status.
"""

from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class SubscriptionStatusResponse(BaseModel):
    """Current subscription status for a restaurant owner."""
    plan_name: Optional[str] = "Sin plan"
    is_trial: bool = False
    days_remaining: int = 0
    max_tables: int = 5
    max_staff_users: int = 3
    current_tables: int = 0
    current_staff: int = 0
    analytics_enabled: bool = False
    cross_sell_enabled: bool = False
    loyalty_enabled: bool = False
    subscription_ends: Optional[str] = None
    trial_ends: Optional[str] = None


class PlanPublicResponse(BaseModel):
    """Public view of an available subscription plan."""
    id: UUID
    name: str
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    max_tables: int
    max_staff_users: int
    analytics_enabled: bool
    cross_sell_enabled: bool
    loyalty_enabled: bool
