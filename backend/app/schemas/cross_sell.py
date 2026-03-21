"""
CheckNow! — Cross-Sell Schemas
Schemas para reglas de venta cruzada y recomendaciones.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID


class CrossSellRuleCreate(BaseModel):
    """Crear una regla de cross-sell."""
    trigger_item_id: UUID = Field(..., description="ID del item que dispara la sugerencia")
    suggested_item_id: UUID = Field(..., description="ID del item sugerido")
    priority: int = Field(0, ge=0, description="Prioridad (mayor = primero)")
    message: Optional[str] = Field(None, max_length=200, examples=["¡Combo perfecto!"])
    discount_pct: float = Field(0.0, ge=0.0, le=1.0, examples=[0.10])


class CrossSellRuleUpdate(BaseModel):
    """Actualizar una regla de cross-sell."""
    priority: Optional[int] = Field(None, ge=0)
    message: Optional[str] = Field(None, max_length=200)
    discount_pct: Optional[float] = Field(None, ge=0.0, le=1.0)
    is_active: Optional[bool] = None


class CrossSellRuleResponse(BaseModel):
    """Respuesta de una regla de cross-sell."""
    id: UUID
    trigger_item_id: UUID
    trigger_item_name: Optional[str] = None
    suggested_item_id: UUID
    suggested_item_name: Optional[str] = None
    priority: int
    message: Optional[str] = None
    discount_pct: float
    is_active: bool

    model_config = {"from_attributes": True}


class SuggestionItem(BaseModel):
    """Un item sugerido al comensal."""
    item_id: UUID
    name: str
    description: Optional[str] = None
    price_usd: float
    image_url: Optional[str] = None
    message: Optional[str] = None
    discount_pct: float = 0.0
    discounted_price: Optional[float] = None


class SuggestionsResponse(BaseModel):
    """Lista de sugerencias para un item del carrito."""
    trigger_item_id: UUID
    trigger_item_name: str
    suggestions: List[SuggestionItem]
