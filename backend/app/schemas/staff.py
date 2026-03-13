"""
CheckNow! — Staff Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional


class StaffCreate(BaseModel):
    """Request schema for creating a staff member."""
    name: str = Field(..., min_length=2, max_length=100, examples=["María López"])
    pin: str = Field(..., min_length=4, max_length=6, examples=["1234"])
    role: str = Field(..., examples=["waiter"])  # owner, manager, cashier, waiter


class StaffUpdate(BaseModel):
    """Request schema for updating a staff member."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    pin: Optional[str] = Field(None, min_length=4, max_length=6)
    role: Optional[str] = None
    is_active: Optional[bool] = None


class StaffResponse(BaseModel):
    """Response schema for staff info."""
    id: str
    name: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
