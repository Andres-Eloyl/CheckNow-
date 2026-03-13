"""
CheckNow! — Notification Schemas
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationResponse(BaseModel):
    """Response schema for a notification."""
    id: str
    table_number: Optional[int] = None
    type: str
    title: str
    message: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
