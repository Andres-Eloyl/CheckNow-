"""
CheckNow! — Table Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID


class TableCreate(BaseModel):
    """Request schema for creating a table."""
    number: int = Field(..., ge=1, examples=[1])
    label: Optional[str] = Field(None, max_length=50, examples=["Terraza A"])
    capacity: int = Field(4, ge=1, le=50, examples=[4])


class TableUpdate(BaseModel):
    """Request schema for updating a table."""
    label: Optional[str] = Field(None, max_length=50)
    capacity: Optional[int] = Field(None, ge=1, le=50)


class TableResponse(BaseModel):
    """Response schema for table info."""
    id: UUID
    number: int
    label: Optional[str] = None
    capacity: int
    status: str
    qr_url: Optional[str] = None

    model_config = {"from_attributes": True}
