"""
CheckNow! — Admin Router
Super-Admin panel for platform management.
Only accessible with SUPER_ADMIN_EMAIL/PASSWORD credentials.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta, date
from typing import List

from app.core.database import get_db
from app.core.config import get_settings
from app.core.security import create_access_token, verify_password, hash_password, decode_token
from app.core.dependencies import get_current_restaurant
from app.models.restaurant import Restaurant, RestaurantConfig
from app.models.subscription import SubscriptionPlan, SubscriptionTransaction, SubscriptionStatus
from app.models.table import Table
from app.models.staff import StaffUser
from app.schemas.admin import (
    AdminLogin, AdminTokenResponse,
    RestaurantAdminView, RestaurantListResponse,
    PlanCreate, PlanUpdate, PlanResponse,
    AssignPlanRequest,
)

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

settings = get_settings()
router = APIRouter(tags=["Admin"])
security_scheme = HTTPBearer()


# ──────────────────────────────────────────────
# Super-Admin Auth Guard
# ──────────────────────────────────────────────

async def get_superadmin(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    """Dependency: validates super-admin JWT."""
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super-admin access required.",
        )
    return payload


# ──────────────────────────────────────────────
# Admin Login
# ──────────────────────────────────────────────

@router.post("/api/admin/login", response_model=AdminTokenResponse)
async def admin_login(data: AdminLogin):
    """Login as the platform Super-Admin."""
    if (
        data.email != settings.SUPER_ADMIN_EMAIL
        or data.password != settings.SUPER_ADMIN_PASSWORD
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials.",
        )

    token_data = {
        "sub": "superadmin",
        "role": "superadmin",
        "email": data.email,
    }
    access_token = create_access_token(token_data, expires_minutes=480)  # 8h

    return AdminTokenResponse(access_token=access_token)


# ──────────────────────────────────────────────
# Restaurant Management
# ──────────────────────────────────────────────

@router.get("/api/admin/restaurants", response_model=RestaurantListResponse)
async def list_all_restaurants(
    _admin: dict = Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """List all restaurants in the platform."""
    result = await db.execute(
        select(Restaurant).order_by(Restaurant.created_at.desc())
    )
    restaurants = result.scalars().all()

    views = []
    for r in restaurants:
        # Get plan name
        plan_name = None
        if r.plan_id:
            plan_result = await db.execute(
                select(SubscriptionPlan.name).where(SubscriptionPlan.id == r.plan_id)
            )
            plan_name = plan_result.scalar_one_or_none()

        # Count tables
        tables_count = await db.execute(
            select(func.count()).select_from(Table).where(Table.restaurant_id == r.id)
        )
        # Count active staff
        staff_count = await db.execute(
            select(func.count()).select_from(StaffUser).where(
                StaffUser.restaurant_id == r.id,
                StaffUser.is_active == True,
            )
        )

        views.append(RestaurantAdminView(
            id=str(r.id),
            slug=r.slug,
            name=r.name,
            email=r.email,
            phone=r.phone,
            country=r.country,
            is_active=r.is_active,
            plan_name=plan_name,
            subscription_ends=str(r.subscription_ends) if r.subscription_ends else None,
            trial_ends=str(r.trial_ends) if r.trial_ends else None,
            tables_count=tables_count.scalar() or 0,
            staff_count=staff_count.scalar() or 0,
            created_at=str(r.created_at),
        ))

    return RestaurantListResponse(total=len(views), restaurants=views)


@router.patch("/api/admin/restaurants/{restaurant_id}/suspend")
async def suspend_restaurant(
    restaurant_id: str,
    _admin: dict = Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Suspend a restaurant (e.g., for non-payment)."""
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found.")

    restaurant.is_active = False
    return {"detail": f"Restaurant '{restaurant.name}' has been suspended."}


@router.patch("/api/admin/restaurants/{restaurant_id}/activate")
async def activate_restaurant(
    restaurant_id: str,
    _admin: dict = Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a suspended restaurant."""
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found.")

    restaurant.is_active = True
    return {"detail": f"Restaurant '{restaurant.name}' has been activated."}


@router.post("/api/admin/restaurants/{restaurant_id}/assign-plan")
async def assign_plan_to_restaurant(
    restaurant_id: str,
    data: AssignPlanRequest,
    _admin: dict = Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually assign a subscription plan to a restaurant.
    Used after confirming external payment (Zelle, transfer, etc).
    """
    # Verify restaurant exists
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found.")

    # Verify plan exists
    plan_result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == data.plan_id)
    )
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    # Calculate period
    now = datetime.now(timezone.utc)
    period_start = now.date()
    period_end = period_start + timedelta(days=30 * data.period_months)

    # Update restaurant
    restaurant.plan_id = plan.id
    restaurant.subscription_ends = datetime(
        period_end.year, period_end.month, period_end.day, tzinfo=timezone.utc
    )
    restaurant.is_active = True

    # Also update config feature flags based on plan
    if restaurant.config:
        restaurant.config.cross_sell_enabled = plan.cross_sell_enabled
        restaurant.config.loyalty_enabled = plan.loyalty_enabled

    # Create transaction record
    transaction = SubscriptionTransaction(
        restaurant_id=restaurant.id,
        plan_id=plan.id,
        amount=data.amount,
        period_start=period_start,
        period_end=period_end,
        status=SubscriptionStatus.PAID,
        payment_ref=data.payment_ref,
    )
    db.add(transaction)

    return {
        "detail": f"Plan '{plan.name}' assigned to '{restaurant.name}' until {period_end}.",
        "subscription_ends": str(period_end),
    }


# ──────────────────────────────────────────────
# Plan CRUD
# ──────────────────────────────────────────────

@router.get("/api/admin/plans", response_model=List[PlanResponse])
async def list_plans(
    _admin: dict = Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """List all subscription plans."""
    result = await db.execute(select(SubscriptionPlan).order_by(SubscriptionPlan.name))
    plans = result.scalars().all()
    return [
        PlanResponse(
            id=str(p.id),
            name=p.name,
            price_monthly=float(p.price_monthly) if p.price_monthly else None,
            price_yearly=float(p.price_yearly) if p.price_yearly else None,
            max_tables=p.max_tables,
            max_staff_users=p.max_staff_users,
            analytics_enabled=p.analytics_enabled,
            cross_sell_enabled=p.cross_sell_enabled,
            loyalty_enabled=p.loyalty_enabled,
            commission_rate=float(p.commission_rate),
        )
        for p in plans
    ]


@router.post("/api/admin/plans", response_model=PlanResponse, status_code=201)
async def create_plan(
    data: PlanCreate,
    _admin: dict = Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new subscription plan."""
    # Check duplicate name
    existing = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.name == data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Plan '{data.name}' already exists.")

    plan = SubscriptionPlan(
        name=data.name,
        price_monthly=data.price_monthly,
        price_yearly=data.price_yearly,
        max_tables=data.max_tables,
        max_staff_users=data.max_staff_users,
        analytics_enabled=data.analytics_enabled,
        cross_sell_enabled=data.cross_sell_enabled,
        loyalty_enabled=data.loyalty_enabled,
        commission_rate=data.commission_rate,
    )
    db.add(plan)
    await db.flush()

    return PlanResponse(
        id=str(plan.id),
        name=plan.name,
        price_monthly=float(plan.price_monthly) if plan.price_monthly else None,
        price_yearly=float(plan.price_yearly) if plan.price_yearly else None,
        max_tables=plan.max_tables,
        max_staff_users=plan.max_staff_users,
        analytics_enabled=plan.analytics_enabled,
        cross_sell_enabled=plan.cross_sell_enabled,
        loyalty_enabled=plan.loyalty_enabled,
        commission_rate=float(plan.commission_rate),
    )


@router.put("/api/admin/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    data: PlanUpdate,
    _admin: dict = Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing subscription plan."""
    result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    if data.name is not None:
        plan.name = data.name
    if data.price_monthly is not None:
        plan.price_monthly = data.price_monthly
    if data.price_yearly is not None:
        plan.price_yearly = data.price_yearly
    if data.max_tables is not None:
        plan.max_tables = data.max_tables
    if data.max_staff_users is not None:
        plan.max_staff_users = data.max_staff_users
    if data.analytics_enabled is not None:
        plan.analytics_enabled = data.analytics_enabled
    if data.cross_sell_enabled is not None:
        plan.cross_sell_enabled = data.cross_sell_enabled
    if data.loyalty_enabled is not None:
        plan.loyalty_enabled = data.loyalty_enabled
    if data.commission_rate is not None:
        plan.commission_rate = data.commission_rate

    return PlanResponse(
        id=str(plan.id),
        name=plan.name,
        price_monthly=float(plan.price_monthly) if plan.price_monthly else None,
        price_yearly=float(plan.price_yearly) if plan.price_yearly else None,
        max_tables=plan.max_tables,
        max_staff_users=plan.max_staff_users,
        analytics_enabled=plan.analytics_enabled,
        cross_sell_enabled=plan.cross_sell_enabled,
        loyalty_enabled=plan.loyalty_enabled,
        commission_rate=float(plan.commission_rate),
    )


@router.delete("/api/admin/plans/{plan_id}", status_code=204)
async def delete_plan(
    plan_id: str,
    _admin: dict = Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a subscription plan. Fails if restaurants are using it."""
    result = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    # Check if any restaurant is using this plan
    usage = await db.execute(
        select(func.count()).select_from(Restaurant).where(Restaurant.plan_id == plan_id)
    )
    count = usage.scalar() or 0
    if count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete plan '{plan.name}': {count} restaurant(s) are using it.",
        )

    await db.delete(plan)
