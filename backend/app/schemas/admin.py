"""
CheckNow! — Admin Schemas
Schemas for the Super-Admin panel.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


# ──────────────────────────────────────────────
# Admin Auth
# ──────────────────────────────────────────────

class AdminLogin(BaseModel):
    """Super-admin login request."""
    email: EmailStr
    password: str


class AdminTokenResponse(BaseModel):
    """Super-admin JWT response."""
    access_token: str
    token_type: str = "bearer"
    role: str = "superadmin"


# ──────────────────────────────────────────────
# Restaurant Management (Admin view)
# ──────────────────────────────────────────────

class RestaurantAdminView(BaseModel):
    """Detailed restaurant view for the admin panel."""
    id: UUID
    slug: str
    name: str
    email: str
    phone: Optional[str] = None
    country: str
    is_active: bool
    plan_name: Optional[str] = None
    subscription_ends: Optional[str] = None
    trial_ends: Optional[str] = None
    tables_count: int = 0
    staff_count: int = 0
    created_at: str


class RestaurantListResponse(BaseModel):
    """Paginated list of restaurants."""
    total: int
    restaurants: List[RestaurantAdminView]


# ──────────────────────────────────────────────
# Plan CRUD
# ──────────────────────────────────────────────

class PlanCreate(BaseModel):
    """Create a subscription plan."""
    name: str = Field(..., min_length=2, max_length=50, examples=["Pro"])
    price_monthly: Optional[float] = Field(None, ge=0, examples=[29.99])
    price_yearly: Optional[float] = Field(None, ge=0, examples=[299.99])
    max_tables: int = Field(default=10, ge=1, examples=[10])
    max_staff_users: int = Field(default=5, ge=1, examples=[5])
    analytics_enabled: bool = False
    cross_sell_enabled: bool = False
    loyalty_enabled: bool = False
    commission_rate: float = Field(default=0.0, ge=0, le=1, examples=[0.02])


class PlanUpdate(BaseModel):
    """Update a subscription plan."""
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    price_monthly: Optional[float] = Field(None, ge=0)
    price_yearly: Optional[float] = Field(None, ge=0)
    max_tables: Optional[int] = Field(None, ge=1)
    max_staff_users: Optional[int] = Field(None, ge=1)
    analytics_enabled: Optional[bool] = None
    cross_sell_enabled: Optional[bool] = None
    loyalty_enabled: Optional[bool] = None
    commission_rate: Optional[float] = Field(None, ge=0, le=1)


class PlanResponse(BaseModel):
    """Subscription plan response."""
    id: UUID
    name: str
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    max_tables: int
    max_staff_users: int
    analytics_enabled: bool
    cross_sell_enabled: bool
    loyalty_enabled: bool
    commission_rate: float


# ──────────────────────────────────────────────
# Assign Plan (manual activation)
# ──────────────────────────────────────────────

class AssignPlanRequest(BaseModel):
    """Assign a plan to a restaurant (manual payment confirmation)."""
    plan_id: UUID
    period_months: int = Field(default=1, ge=1, le=12, examples=[1])
    payment_ref: Optional[str] = Field(None, max_length=255, examples=["Zelle-REF-12345"])
    amount: float = Field(..., gt=0, examples=[29.99])
