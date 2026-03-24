"""
CheckNow! — Restaurant Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class RestaurantPublic(BaseModel):
    """Public restaurant info (no sensitive data)."""
    id: UUID
    slug: str
    name: str
    country: str
    primary_color: Optional[str] = "#6C63FF"
    secondary_color: Optional[str] = "#FF6B35"
    logo_url: Optional[str] = None

    model_config = {"from_attributes": True}


class RestaurantConfigUpdate(BaseModel):
    """Schema for updating restaurant configuration."""
    tax_rate: Optional[float] = Field(None, ge=0, le=1, examples=[0.16])
    service_charge: Optional[float] = Field(None, ge=0, le=1, examples=[0.10])
    currency_primary: Optional[str] = Field(None, max_length=3, examples=["USD"])
    accepted_methods: Optional[List[str]] = Field(
        None, examples=[["pago_movil", "zelle", "efectivo"]]
    )
    primary_color: Optional[str] = Field(None, max_length=7, examples=["#6C63FF"])
    secondary_color: Optional[str] = Field(None, max_length=7, examples=["#FF6B35"])
    wifi_ssid: Optional[str] = Field(None, max_length=100)
    cross_sell_enabled: Optional[bool] = None
    loyalty_enabled: Optional[bool] = None


class RestaurantConfigResponse(BaseModel):
    """Full restaurant configuration response."""
    restaurant_id: UUID
    tax_rate: float
    service_charge: float
    currency_primary: str
    accepted_methods: list
    primary_color: str
    secondary_color: str
    logo_url: Optional[str] = None
    wifi_ssid: Optional[str] = None
    cross_sell_enabled: bool
    loyalty_enabled: bool

    model_config = {"from_attributes": True}
