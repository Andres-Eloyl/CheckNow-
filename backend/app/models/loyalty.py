"""
CheckNow! — Loyalty Account Model (Puntos QR)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, NUMERIC
from app.core.database import Base


class LoyaltyAccount(Base):
    __tablename__ = "loyalty_accounts"
    __table_args__ = (
        UniqueConstraint(
            "restaurant_id", "phone_hash", name="uq_loyalty_restaurant_phone"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True
    )
    phone_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    points_balance: Mapped[int] = mapped_column(Integer, default=0)
    total_spent_usd: Mapped[float] = mapped_column(NUMERIC(10, 2), default=0.00)
    visit_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_active: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<LoyaltyAccount {self.phone_hash[:8]}... ({self.points_balance} pts)>"
