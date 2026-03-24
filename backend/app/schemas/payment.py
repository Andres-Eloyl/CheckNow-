"""
CheckNow! — Payment Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class PaymentCreate(BaseModel):
    """Request schema for registering a payment."""
    amount_usd: float = Field(..., gt=0, examples=[15.50])
    currency: str = Field(..., examples=["USD"])
    method: str = Field(..., examples=["pago_movil"])
    tip_amount: float = Field(0.0, ge=0, examples=[2.00])
    reference_code: Optional[str] = Field(None, max_length=255, examples=["00001234567"])
    exchange_rate: Optional[float] = Field(None, examples=[36.50])
    amount_local: Optional[float] = Field(None, examples=[565.75])


class PaymentResponse(BaseModel):
    """Response schema for a payment."""
    id: UUID
    session_user_id: UUID
    amount_usd: float
    amount_local: Optional[float] = None
    currency: str
    method: str
    tip_amount: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentVerify(BaseModel):
    """Request schema for cashier verifying a payment."""
    pass  # No body needed — just the staff JWT for auth


class PaymentReject(BaseModel):
    """Request schema for cashier rejecting a payment."""
    reason: str = Field(..., min_length=5, max_length=500, examples=["Reference not found"])


class CheckoutSummary(BaseModel):
    """Individual checkout breakdown before paying."""
    user_id: UUID
    alias: str
    subtotal: float
    tax: float
    service_charge: float
    suggested_tip_10: float
    suggested_tip_15: float
    suggested_tip_20: float
    total_before_tip: float


class ExchangeRateResponse(BaseModel):
    """BCV exchange rate response."""
    date: str
    usd_to_ves: float
    source: str = "bcv"
    fetched_at: datetime
