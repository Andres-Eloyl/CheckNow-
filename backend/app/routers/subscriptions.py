"""
CheckNow! — Subscriptions Router
Endpoints for restaurant owners to view their plan status and browse available plans.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_restaurant, get_restaurant_id
from app.models.restaurant import Restaurant
from app.models.subscription import SubscriptionPlan
from app.models.table import Table
from app.models.staff import StaffUser
from app.schemas.subscription import SubscriptionStatusResponse, PlanPublicResponse

router = APIRouter(tags=["Subscriptions"])


@router.get("/api/{slug}/subscription/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    slug: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Get the current subscription status for this restaurant."""
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found.")

    # Get plan info
    plan_name = "Sin plan"
    max_tables = 5  # Defaults for no plan
    max_staff = 3
    analytics = False
    cross_sell = False
    loyalty = False

    if restaurant.plan_id:
        plan_result = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.id == restaurant.plan_id)
        )
        plan = plan_result.scalar_one_or_none()
        if plan:
            plan_name = plan.name
            max_tables = plan.max_tables
            max_staff = plan.max_staff_users
            analytics = plan.analytics_enabled
            cross_sell = plan.cross_sell_enabled
            loyalty = plan.loyalty_enabled

    # Count current usage
    tables_count_result = await db.execute(
        select(func.count()).select_from(Table).where(Table.restaurant_id == restaurant.id)
    )
    staff_count_result = await db.execute(
        select(func.count()).select_from(StaffUser).where(
            StaffUser.restaurant_id == restaurant.id,
            StaffUser.is_active == True,
        )
    )

    # Calculate days remaining
    now = datetime.now(timezone.utc)
    days_remaining = 0
    is_trial = False

    if restaurant.trial_ends and restaurant.trial_ends > now:
        days_remaining = (restaurant.trial_ends - now).days
        is_trial = True
    elif restaurant.subscription_ends and restaurant.subscription_ends > now:
        days_remaining = (restaurant.subscription_ends - now).days

    return SubscriptionStatusResponse(
        plan_name=plan_name,
        is_trial=is_trial,
        days_remaining=days_remaining,
        max_tables=max_tables,
        max_staff_users=max_staff,
        current_tables=tables_count_result.scalar() or 0,
        current_staff=staff_count_result.scalar() or 0,
        analytics_enabled=analytics,
        cross_sell_enabled=cross_sell,
        loyalty_enabled=loyalty,
        subscription_ends=str(restaurant.subscription_ends) if restaurant.subscription_ends else None,
        trial_ends=str(restaurant.trial_ends) if restaurant.trial_ends else None,
    )


@router.get("/api/{slug}/subscription/plans", response_model=List[PlanPublicResponse])
async def list_available_plans(
    slug: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """List all available subscription plans (for upgrade)."""
    result = await db.execute(
        select(SubscriptionPlan).order_by(SubscriptionPlan.max_tables)
    )
    plans = result.scalars().all()

    return [
        PlanPublicResponse(
            id=str(p.id),
            name=p.name,
            price_monthly=float(p.price_monthly) if p.price_monthly else None,
            price_yearly=float(p.price_yearly) if p.price_yearly else None,
            max_tables=p.max_tables,
            max_staff_users=p.max_staff_users,
            analytics_enabled=p.analytics_enabled,
            cross_sell_enabled=p.cross_sell_enabled,
            loyalty_enabled=p.loyalty_enabled,
        )
        for p in plans
    ]
