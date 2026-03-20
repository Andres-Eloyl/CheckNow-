"""
CheckNow! — Cross-Sell Router
Gestión de reglas de venta cruzada y endpoint público de sugerencias.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
import uuid

from app.core.database import get_db
from app.core.dependencies import get_restaurant_id, get_current_staff
from app.models.cross_sell import CrossSellRule
from app.models.menu import MenuItem
from app.models.restaurant import Restaurant
from app.schemas.cross_sell import (
    CrossSellRuleCreate,
    CrossSellRuleUpdate,
    CrossSellRuleResponse,
    SuggestionItem,
    SuggestionsResponse,
)

router = APIRouter(tags=["Cross-Sell"])


# ──────────────────────────────────────────────
# Staff: CRUD de reglas
# ──────────────────────────────────────────────

@router.post("/api/{slug}/cross-sell/rules", response_model=CrossSellRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(
    slug: str,
    rule_in: CrossSellRuleCreate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Crear una regla de cross-sell (staff)."""
    # Verificar que cross_sell_enabled esté activo
    rest_result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = rest_result.scalars().first()
    if not restaurant or not restaurant.cross_sell_enabled:
        raise HTTPException(
            status_code=402,
            detail="Cross-selling no está habilitado en tu plan. Actualiza tu suscripción."
        )

    # Verificar que ambos items existan y pertenezcan al restaurante
    for item_id_str in [rule_in.trigger_item_id, rule_in.suggested_item_id]:
        item_result = await db.execute(
            select(MenuItem)
            .join(MenuItem.category)
            .where(
                MenuItem.id == item_id_str,
                MenuItem.category.has(restaurant_id=restaurant_id)
            )
        )
        if not item_result.scalars().first():
            raise HTTPException(status_code=404, detail=f"Item {item_id_str} no encontrado en tu menú")

    # No permitir que un item se sugiera a sí mismo
    if rule_in.trigger_item_id == rule_in.suggested_item_id:
        raise HTTPException(status_code=400, detail="Un item no puede sugerirse a sí mismo")

    # Verificar que no exista una regla duplicada
    existing = await db.execute(
        select(CrossSellRule).where(
            CrossSellRule.restaurant_id == restaurant_id,
            CrossSellRule.trigger_item_id == rule_in.trigger_item_id,
            CrossSellRule.suggested_item_id == rule_in.suggested_item_id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Esta regla ya existe")

    rule = CrossSellRule(
        restaurant_id=restaurant_id,
        trigger_item_id=rule_in.trigger_item_id,
        suggested_item_id=rule_in.suggested_item_id,
        priority=rule_in.priority,
        message=rule_in.message,
        discount_pct=rule_in.discount_pct,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)

    # Obtener nombres de los items para la respuesta
    trigger_name, suggested_name = await _get_item_names(db, rule.trigger_item_id, rule.suggested_item_id)

    return CrossSellRuleResponse(
        id=str(rule.id),
        trigger_item_id=str(rule.trigger_item_id),
        trigger_item_name=trigger_name,
        suggested_item_id=str(rule.suggested_item_id),
        suggested_item_name=suggested_name,
        priority=rule.priority,
        message=rule.message,
        discount_pct=rule.discount_pct,
        is_active=rule.is_active,
    )


@router.get("/api/{slug}/cross-sell/rules", response_model=List[CrossSellRuleResponse])
async def list_rules(
    slug: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Listar todas las reglas de cross-sell del restaurante."""
    result = await db.execute(
        select(CrossSellRule)
        .where(CrossSellRule.restaurant_id == restaurant_id)
        .order_by(CrossSellRule.priority.desc())
    )
    rules = result.scalars().all()

    responses = []
    for rule in rules:
        trigger_name, suggested_name = await _get_item_names(db, rule.trigger_item_id, rule.suggested_item_id)
        responses.append(CrossSellRuleResponse(
            id=str(rule.id),
            trigger_item_id=str(rule.trigger_item_id),
            trigger_item_name=trigger_name,
            suggested_item_id=str(rule.suggested_item_id),
            suggested_item_name=suggested_name,
            priority=rule.priority,
            message=rule.message,
            discount_pct=rule.discount_pct,
            is_active=rule.is_active,
        ))

    return responses


@router.put("/api/{slug}/cross-sell/rules/{rule_id}", response_model=CrossSellRuleResponse)
async def update_rule(
    slug: str,
    rule_id: str,
    rule_in: CrossSellRuleUpdate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar una regla de cross-sell."""
    result = await db.execute(
        select(CrossSellRule).where(
            CrossSellRule.id == rule_id,
            CrossSellRule.restaurant_id == restaurant_id,
        )
    )
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Regla no encontrada")

    update_data = rule_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)

    await db.commit()
    await db.refresh(rule)

    trigger_name, suggested_name = await _get_item_names(db, rule.trigger_item_id, rule.suggested_item_id)

    return CrossSellRuleResponse(
        id=str(rule.id),
        trigger_item_id=str(rule.trigger_item_id),
        trigger_item_name=trigger_name,
        suggested_item_id=str(rule.suggested_item_id),
        suggested_item_name=suggested_name,
        priority=rule.priority,
        message=rule.message,
        discount_pct=rule.discount_pct,
        is_active=rule.is_active,
    )


@router.delete("/api/{slug}/cross-sell/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    slug: str,
    rule_id: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """Eliminar una regla de cross-sell."""
    result = await db.execute(
        select(CrossSellRule).where(
            CrossSellRule.id == rule_id,
            CrossSellRule.restaurant_id == restaurant_id,
        )
    )
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Regla no encontrada")

    await db.delete(rule)
    await db.commit()


# ──────────────────────────────────────────────
# Público: Sugerencias para comensales
# ──────────────────────────────────────────────

@router.get("/api/{slug}/cross-sell/suggestions", response_model=SuggestionsResponse)
async def get_suggestions(
    slug: str,
    item_id: str = Query(..., description="ID del item que el comensal acaba de agregar al carrito"),
    limit: int = Query(3, ge=1, le=10, description="Máximo de sugerencias"),
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtener sugerencias de cross-sell para un item.
    Endpoint público — lo llama el frontend cuando el comensal agrega algo al carrito.
    Solo devuelve sugerencias si el restaurante tiene cross-sell habilitado.
    """
    # Verificar que el restaurante tiene cross-sell habilitado
    rest_result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id)
    )
    restaurant = rest_result.scalars().first()
    if not restaurant or not restaurant.cross_sell_enabled:
        # No tiene cross-sell: devolver lista vacía (no error)
        trigger_result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
        trigger_item = trigger_result.scalars().first()
        return SuggestionsResponse(
            trigger_item_id=item_id,
            trigger_item_name=trigger_item.name if trigger_item else "Desconocido",
            suggestions=[],
        )

    # Obtener el item trigger
    trigger_result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    trigger_item = trigger_result.scalars().first()
    if not trigger_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    # Buscar reglas activas para este item
    rules_result = await db.execute(
        select(CrossSellRule, MenuItem)
        .join(MenuItem, CrossSellRule.suggested_item_id == MenuItem.id)
        .where(
            CrossSellRule.restaurant_id == restaurant_id,
            CrossSellRule.trigger_item_id == item_id,
            CrossSellRule.is_active == True,
            MenuItem.is_available == True,
        )
        .order_by(CrossSellRule.priority.desc())
        .limit(limit)
    )
    rows = rules_result.all()

    suggestions = []
    for rule, suggested_item in rows:
        price = float(suggested_item.price_usd)
        discount = rule.discount_pct or 0.0
        discounted = round(price * (1 - discount), 2) if discount > 0 else None

        suggestions.append(SuggestionItem(
            item_id=str(suggested_item.id),
            name=suggested_item.name,
            description=suggested_item.description,
            price_usd=price,
            image_url=suggested_item.image_url,
            message=rule.message,
            discount_pct=discount,
            discounted_price=discounted,
        ))

    return SuggestionsResponse(
        trigger_item_id=item_id,
        trigger_item_name=trigger_item.name,
        suggestions=suggestions,
    )


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

async def _get_item_names(db: AsyncSession, trigger_id, suggested_id) -> tuple[str | None, str | None]:
    """Obtener nombres de dos items por ID."""
    t_result = await db.execute(select(MenuItem.name).where(MenuItem.id == trigger_id))
    s_result = await db.execute(select(MenuItem.name).where(MenuItem.id == suggested_id))
    trigger_name = t_result.scalar()
    suggested_name = s_result.scalar()
    return trigger_name, suggested_name
