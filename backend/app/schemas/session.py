"""
CheckNow! — Session Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SessionCreate(BaseModel):
    """Request schema for opening a table session."""
    table_id: str = Field(..., examples=["uuid-of-table"])


class SessionJoin(BaseModel):
    """Request schema for a comensal joining a session."""
    alias: str = Field(..., min_length=1, max_length=50, examples=["Andrés"])


class SessionUserResponse(BaseModel):
    """Response schema for a session user."""
    id: str
    alias: str
    color: str
    emoji: Optional[str] = None
    is_loyalty_linked: bool = False
    joined_at: datetime

    model_config = {"from_attributes": True}

class SessionUserLinkLoyalty(BaseModel):
    """Request schema for linking phone to session user."""
    phone_number: str = Field(..., description="Número celular del comensal")


class SessionResponse(BaseModel):
    """Response schema for session info."""
    id: str
    table_id: str
    table_number: Optional[int] = None
    token: str
    status: str
    opened_at: datetime
    expires_at: datetime
    users: List[SessionUserResponse] = []
    total_amount: float = 0.0

    model_config = {"from_attributes": True}


class SessionBalanceResponse(BaseModel):
    """Response schema for session payment balance."""
    total: float
    tax: float
    tips: float
    paid: float
    remaining: float
