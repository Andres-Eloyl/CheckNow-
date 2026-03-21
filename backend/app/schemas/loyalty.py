"""
CheckNow! — Loyalty Schemas
Schemas para el Puntos QR (Loyalty)
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LoyaltyCheckRequest(BaseModel):
    """Comensal introduce su teléfono para consultar puntos."""
    phone_number: str = Field(..., description="Número de teléfono (con código de país ej +584121234567)")


class LoyaltyAccountResponse(BaseModel):
    """Respuesta con el estado de la cuenta de lealtad."""
    id: str
    phone_hash: str
    points_balance: int
    total_spent_usd: float
    visit_count: int
    created_at: datetime
    last_active: datetime
    
    # Extra fields config
    points_reward_rate: int
    points_redemption_value: float

    model_config = {"from_attributes": True}


class LoyaltyRedeemRequest(BaseModel):
    """Comensal solicita canjear X puntos."""
    phone_number: str = Field(..., description="Número de teléfono del comensal")
    points_to_redeem: int = Field(..., ge=1, description="Cantidad de puntos a canjear")
    session_token: str = Field(..., description="Token de la sesión actual donde se aplicará el descuento")


class LoyaltyEarnResponse(BaseModel):
    """Resumen después de sumar puntos."""
    points_earned: int
    new_balance: int
    message: str


class LoyaltyDashboardCustomer(BaseModel):
    """Perfil de cliente para el dashboard del owner."""
    phone_hash_short: str
    points_balance: int
    total_spent_usd: float
    visit_count: int
    last_active: datetime
