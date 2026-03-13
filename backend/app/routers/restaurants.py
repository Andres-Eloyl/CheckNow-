"""
CheckNow! — Restaurants Router
Public info and config management.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_restaurant, get_restaurant_id
from app.models.restaurant import Restaurant, RestaurantConfig
from app.schemas.restaurant import (
    RestaurantPublic, RestaurantConfigUpdate, RestaurantConfigResponse,
)

router = APIRouter(tags=["Restaurants"])


@router.get("/api/restaurants/{slug}", response_model=RestaurantPublic)
async def get_restaurant_public(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get public restaurant info (no auth required)."""
    result = await db.execute(
        select(Restaurant).where(Restaurant.slug == slug, Restaurant.is_active == True)
    )
    restaurant = result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found.")

    config = restaurant.config
    return RestaurantPublic(
        id=str(restaurant.id),
        slug=restaurant.slug,
        name=restaurant.name,
        country=restaurant.country,
        primary_color=config.primary_color if config else "#6C63FF",
        secondary_color=config.secondary_color if config else "#FF6B35",
        logo_url=config.logo_url if config else None,
    )


@router.get("/api/{slug}/config", response_model=RestaurantConfigResponse)
async def get_config(
    slug: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Get full restaurant config (staff auth required)."""
    result = await db.execute(
        select(RestaurantConfig).where(
            RestaurantConfig.restaurant_id == restaurant_id
        )
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found.")

    return RestaurantConfigResponse(
        restaurant_id=str(config.restaurant_id),
        tax_rate=float(config.tax_rate),
        service_charge=float(config.service_charge),
        currency_primary=config.currency_primary,
        accepted_methods=config.accepted_methods,
        primary_color=config.primary_color,
        secondary_color=config.secondary_color,
        logo_url=config.logo_url,
        wifi_ssid=config.wifi_ssid,
        cross_sell_enabled=config.cross_sell_enabled,
        loyalty_enabled=config.loyalty_enabled,
    )


@router.put("/api/{slug}/config", response_model=RestaurantConfigResponse)
async def update_config(
    slug: str,
    data: RestaurantConfigUpdate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Update restaurant config (owner/manager only)."""
    result = await db.execute(
        select(RestaurantConfig).where(
            RestaurantConfig.restaurant_id == restaurant_id
        )
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found.")

    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)

    return RestaurantConfigResponse(
        restaurant_id=str(config.restaurant_id),
        tax_rate=float(config.tax_rate),
        service_charge=float(config.service_charge),
        currency_primary=config.currency_primary,
        accepted_methods=config.accepted_methods,
        primary_color=config.primary_color,
        secondary_color=config.secondary_color,
        logo_url=config.logo_url,
        wifi_ssid=config.wifi_ssid,
        cross_sell_enabled=config.cross_sell_enabled,
        loyalty_enabled=config.loyalty_enabled,
    )
