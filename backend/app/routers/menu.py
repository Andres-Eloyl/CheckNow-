"""
CheckNow! — Menu Router
CRUD operations for categories, items, and modifiers.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.core.database import get_db
from app.core.dependencies import get_restaurant_id, get_current_staff
from app.websockets.manager import ws_manager
from app.models.menu import MenuCategory, MenuItem, MenuItemModifier
from app.schemas.menu import (
    MenuResponse,
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    MenuItemCreate,
    MenuItemUpdate,
    MenuItemResponse,
    ModifierCreate,
    ModifierResponse,
)

router = APIRouter(prefix="/api/{slug}/menu", tags=["menu"])


# ──────────────────────────────────────────────
# Public Menu Fetch
# ──────────────────────────────────────────────
@router.get("", response_model=MenuResponse)
async def get_menu(
    slug: str,
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the full menu for a restaurant (Categories -> Items -> Modifiers).
    This is public (used by comensales).
    """
    result = await db.execute(
        select(MenuCategory)
        .where(
            MenuCategory.restaurant_id == restaurant_id,
            MenuCategory.is_active == True,
        )
        .order_by(MenuCategory.display_order)
    )
    categories = result.scalars().all()
    
    return MenuResponse(categories=categories)


# ──────────────────────────────────────────────
# Categories CRUD
# ──────────────────────────────────────────────
@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    slug: str,
    category_in: CategoryCreate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Create a new menu category (Staff only)."""
    category = MenuCategory(
        restaurant_id=restaurant_id,
        name=category_in.name,
        display_order=category_in.display_order,
        icon=category_in.icon,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    slug: str,
    category_id: str,
    category_in: CategoryUpdate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Update a menu category (Staff only)."""
    result = await db.execute(
        select(MenuCategory).where(
            MenuCategory.id == category_id,
            MenuCategory.restaurant_id == restaurant_id
        )
    )
    category = result.scalars().first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    update_data = category_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
        
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    slug: str,
    category_id: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Delete a menu category (Staff only)."""
    result = await db.execute(
        select(MenuCategory).where(
            MenuCategory.id == category_id,
            MenuCategory.restaurant_id == restaurant_id
        )
    )
    category = result.scalars().first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    await db.delete(category)
    await db.commit()
    return None


# ──────────────────────────────────────────────
# Items CRUD
# ──────────────────────────────────────────────
@router.post("/items", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    slug: str,
    item_in: MenuItemCreate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Create a new menu item (Staff only)."""
    # Verify category belongs to this restaurant
    result = await db.execute(
        select(MenuCategory).where(
            MenuCategory.id == item_in.category_id,
            MenuCategory.restaurant_id == restaurant_id
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=400, detail="Invalid category_id")
        
    item_data = item_in.model_dump()
    item = MenuItem(**item_data)
    
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=MenuItemResponse)
async def update_item(
    slug: str,
    item_id: str,
    item_in: MenuItemUpdate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Update a menu item (Staff only)."""
    result = await db.execute(
        select(MenuItem)
        .join(MenuCategory, MenuItem.category_id == MenuCategory.id)
        .where(
            MenuItem.id == item_id,
            MenuCategory.restaurant_id == restaurant_id
        )
    )
    item = result.scalars().first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    update_data = item_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
        
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    slug: str,
    item_id: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Delete a menu item (Staff only)."""
    result = await db.execute(
        select(MenuItem)
        .join(MenuCategory, MenuItem.category_id == MenuCategory.id)
        .where(
            MenuItem.id == item_id,
            MenuCategory.restaurant_id == restaurant_id
        )
    )
    item = result.scalars().first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    await db.delete(item)
    await db.commit()
    return None


@router.patch("/items/{item_id}/stock", response_model=MenuItemResponse)
async def update_item_stock(
    slug: str,
    item_id: str,
    stock_count: int,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Update item stock count. If it hits 0, broadcasts item_sold_out."""
    result = await db.execute(
        select(MenuItem)
        .join(MenuCategory, MenuItem.category_id == MenuCategory.id)
        .where(
            MenuItem.id == item_id,
            MenuCategory.restaurant_id == restaurant_id
        )
    )
    item = result.scalars().first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    item.stock_count = stock_count
    
    if stock_count == 0:
        item.is_available = False
        # Broadcast to dashboard
        await ws_manager.broadcast(
            f"ws:dashboard:{slug}",
            {
                "event": "item_sold_out",
                "data": {"item_id": str(item.id), "name": item.name}
            }
        )
        
    await db.commit()
    await db.refresh(item)
    return item


# ──────────────────────────────────────────────
# Modifiers CRUD
# ──────────────────────────────────────────────
@router.post("/items/{item_id}/modifiers", response_model=ModifierResponse, status_code=status.HTTP_201_CREATED)
async def create_modifier(
    slug: str,
    item_id: str,
    modifier_in: ModifierCreate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Create a new modifier for an item (Staff only)."""
    # Verify item belongs to this restaurant
    result = await db.execute(
        select(MenuItem)
        .join(MenuCategory, MenuItem.category_id == MenuCategory.id)
        .where(
            MenuItem.id == item_id,
            MenuCategory.restaurant_id == restaurant_id
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Item not found")
        
    modifier = MenuItemModifier(
        item_id=item_id,
        name=modifier_in.name,
        extra_price=modifier_in.extra_price
    )
    db.add(modifier)
    await db.commit()
    await db.refresh(modifier)
    return modifier


@router.delete("/modifiers/{modifier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_modifier(
    slug: str,
    modifier_id: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Delete a modifier (Staff only)."""
    result = await db.execute(
        select(MenuItemModifier)
        .join(MenuItem, MenuItemModifier.item_id == MenuItem.id)
        .join(MenuCategory, MenuItem.category_id == MenuCategory.id)
        .where(
            MenuItemModifier.id == modifier_id,
            MenuCategory.restaurant_id == restaurant_id
        )
    )
    modifier = result.scalars().first()
    
    if not modifier:
        raise HTTPException(status_code=404, detail="Modifier not found")
        
    await db.delete(modifier)
    await db.commit()
    return None
