"""
CheckNow! — Order Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class OrderItemCreate(BaseModel):
    """Request schema for adding an item to the cart."""
    menu_item_id: UUID
    quantity: int = Field(1, ge=1, le=20)
    modifiers: Optional[List[str]] = Field(None, examples=[["Sin cebolla", "Extra queso"]])
    notes: Optional[str] = Field(None, max_length=200, examples=["Término medio"])
    is_shared: bool = False


class OrderItemResponse(BaseModel):
    """Response schema for an order item."""
    id: UUID
    session_user_id: UUID
    session_user_alias: Optional[str] = None
    menu_item_id: UUID
    menu_item_name: Optional[str] = None
    table_number: Optional[str] = None
    quantity: int
    unit_price: float
    modifiers: list = []
    notes: Optional[str] = None
    status: str
    is_shared: bool
    is_locked: bool
    created_at: datetime
    sent_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    """Request schema for staff changing order status."""
    status: str = Field(..., examples=["preparing"])  # sent, preparing, ready, delivered
