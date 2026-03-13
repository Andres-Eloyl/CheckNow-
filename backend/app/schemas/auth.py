"""
CheckNow! — Auth Schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# ──────────────────────────────────────────────
# Restaurant Auth
# ──────────────────────────────────────────────

class RestaurantRegister(BaseModel):
    """Request schema for registering a new restaurant."""
    name: str = Field(..., min_length=2, max_length=255, examples=["Pizzería Roma"])
    slug: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-z0-9-]+$",
                      examples=["pizzeria-roma"])
    email: EmailStr = Field(..., examples=["admin@pizzeriaroma.com"])
    password: str = Field(..., min_length=8, max_length=100)
    phone: Optional[str] = Field(None, max_length=20, examples=["+58412123456"])
    country: str = Field("VE", max_length=3, examples=["VE"])


class RestaurantLogin(BaseModel):
    """Request schema for restaurant login."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response schema for authentication tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    restaurant_id: str
    slug: str


class RefreshTokenRequest(BaseModel):
    """Request schema for refreshing tokens."""
    refresh_token: str


# ──────────────────────────────────────────────
# Staff Auth
# ──────────────────────────────────────────────

class StaffLogin(BaseModel):
    """Request schema for staff login with PIN."""
    name: str = Field(..., examples=["María"])
    pin: str = Field(..., min_length=4, max_length=6, examples=["1234"])


class StaffTokenResponse(BaseModel):
    """Response schema for staff authentication."""
    access_token: str
    token_type: str = "bearer"
    staff_id: str
    name: str
    role: str
