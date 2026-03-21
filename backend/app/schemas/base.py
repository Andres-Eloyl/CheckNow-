"""
CheckNow! — Base Schema
Shared Pydantic configuration for all response schemas.
"""

from pydantic import BaseModel
from uuid import UUID


class BaseSchema(BaseModel):
    """Base schema with shared configuration for all CheckNow! response models."""

    model_config = {
        "from_attributes": True,
        "json_encoders": {UUID: str},
        # Pydantic v2: serialize UUID → str automatically
        "ser_json_bytes": "utf8",
    }
