"""
CheckNow! — Split Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID


class SplitCreate(BaseModel):
    """Request schema for initiating a split on an order item."""
    order_item_id: UUID
    participants: List[UUID] = Field(
        ..., min_length=1,
        description="List of session_user_ids to split with"
    )
    fractions: Optional[List[float]] = Field(
        None,
        description="Custom fractions per participant. If None, splits equally."
    )


class SplitResponse(BaseModel):
    """Response for a split assignment."""
    id: UUID
    order_item_id: UUID
    order_item_name: Optional[str] = None
    requested_by: UUID
    session_user_id: UUID
    fraction: float
    amount_owed: float
    accepted: bool
    expires_at: str

    model_config = {"from_attributes": True}


class PayForRequest(BaseModel):
    """Request schema for 'Yo invito' — paying for someone else's item."""
    order_item_id: UUID
    beneficiary_user_id: UUID
