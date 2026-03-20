"""
CheckNow! — Auth Router
Handles restaurant registration/login and staff PIN login.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, hash_pin, verify_pin,
    create_access_token, create_refresh_token, create_staff_token,
    decode_token,
)
from app.core.dependencies import get_current_restaurant
from app.models.restaurant import Restaurant, RestaurantConfig
from app.models.staff import StaffUser
from app.models.subscription import SubscriptionPlan
from app.schemas.auth import (
    RestaurantRegister, RestaurantLogin, TokenResponse,
    RefreshTokenRequest, StaffLogin, StaffTokenResponse, RestaurantMeResponse
)

router = APIRouter(tags=["Authentication"])


# ──────────────────────────────────────────────
# Restaurant Auth
# ──────────────────────────────────────────────

@router.post("/api/auth/register", response_model=TokenResponse, status_code=201)
async def register_restaurant(
    data: RestaurantRegister,
    db: AsyncSession = Depends(get_db),
):
    """Register a new restaurant in the SaaS platform."""
    # Check if slug or email already exists
    existing = await db.execute(
        select(Restaurant).where(
            (Restaurant.slug == data.slug) | (Restaurant.email == data.email)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A restaurant with that slug or email already exists.",
        )

    # Create restaurant
    restaurant = Restaurant(
        name=data.name,
        slug=data.slug,
        email=data.email,
        password_hash=hash_password(data.password),
        phone=data.phone,
        country=data.country,
    )
    db.add(restaurant)
    await db.flush()  # Get the ID before creating config

    # Create default config
    config = RestaurantConfig(restaurant_id=restaurant.id)
    db.add(config)

    # Auto-assign Free plan + 14-day trial
    free_plan = await db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.name == "Free")
    )
    free_plan_obj = free_plan.scalar_one_or_none()
    if free_plan_obj:
        restaurant.plan_id = free_plan_obj.id
        restaurant.trial_ends = datetime.now(timezone.utc) + timedelta(days=14)

    # Generate tokens
    token_data = {"sub": str(restaurant.id), "slug": restaurant.slug, "role": "owner"}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        restaurant_id=str(restaurant.id),
        slug=restaurant.slug,
    )


@router.post("/api/auth/login", response_model=TokenResponse)
async def login_restaurant(
    data: RestaurantLogin,
    db: AsyncSession = Depends(get_db),
):
    """Login as a restaurant owner/manager."""
    result = await db.execute(
        select(Restaurant).where(Restaurant.email == data.email)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant or not verify_password(data.password, restaurant.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not restaurant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restaurant account is suspended.",
        )

    token_data = {"sub": str(restaurant.id), "slug": restaurant.slug, "role": "owner"}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        restaurant_id=str(restaurant.id),
        slug=restaurant.slug,
    )


@router.post("/api/auth/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh an expired access token."""
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    restaurant_id = payload["sub"]
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()

    if not restaurant or not restaurant.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Restaurant not found or suspended.",
        )

    token_data = {"sub": str(restaurant.id), "slug": restaurant.slug, "role": "owner"}
    access_token = create_access_token(token_data)
    refresh_token_new = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_new,
        restaurant_id=str(restaurant.id),
        slug=restaurant.slug,
    )


@router.get("/api/auth/me", response_model=RestaurantMeResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Get the current authenticated restaurant's profile."""
    restaurant_id = current_user.get("sub")
    if not restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )
        
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = result.scalar_one_or_none()
    
    if not restaurant or not restaurant.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Restaurant not found or inactive.",
        )
        
    return RestaurantMeResponse(
        id=str(restaurant.id),
        name=restaurant.name,
        slug=restaurant.slug,
        email=restaurant.email,
        phone=restaurant.phone,
        country=restaurant.country,
        is_active=restaurant.is_active,
    )


# ──────────────────────────────────────────────
# Staff Auth (PIN-based for tablets)
# ──────────────────────────────────────────────

@router.post("/api/{slug}/staff/login", response_model=StaffTokenResponse)
async def login_staff(
    slug: str,
    data: StaffLogin,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Login as a staff member using name + PIN."""
    restaurant_id = getattr(request.state, "restaurant_id", None)
    if not restaurant_id:
        raise HTTPException(status_code=404, detail="Restaurant not found.")

    result = await db.execute(
        select(StaffUser).where(
            StaffUser.restaurant_id == restaurant_id,
            StaffUser.name == data.name,
            StaffUser.is_active == True,
        )
    )
    staff = result.scalar_one_or_none()

    if not staff or not verify_pin(data.pin, staff.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid name or PIN.",
        )

    token_data = {
        "sub": str(staff.id),
        "restaurant_id": restaurant_id,
        "slug": slug,
        "role": staff.role.value,
        "name": staff.name,
    }
    access_token = create_staff_token(token_data)

    return StaffTokenResponse(
        access_token=access_token,
        staff_id=str(staff.id),
        name=staff.name,
        role=staff.role.value,
    )
