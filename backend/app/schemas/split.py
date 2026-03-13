"""
CheckNow! — Split Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class SplitCreate(BaseModel):
    """Request schema for initiating a split on an order item."""
    order_item_id: str
    participants: List[str] = Field(
        ..., min_length=1,
        description="List of session_user_ids to split with"
    )
    fractions: Optional[List[float]] = Field(
        None,
        description="Custom fractions per participant. If None, splits equally."
    )


class SplitResponse(BaseModel):
    """Response for a split assignment."""
    id: str
    order_item_id: str
    order_item_name: Optional[str] = None
    requested_by: str
    session_user_id: str
    fraction: float
    amount_owed: float
    accepted: bool
    expires_at: str

    model_config = {"from_attributes": True}


class PayForRequest(BaseModel):
    """Request schema for 'Yo invito' — paying for someone else's item."""
    order_item_id: str
    beneficiary_user_id: str
