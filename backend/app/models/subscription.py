"""
CheckNow! — Subscription Models
"""

import uuid
from datetime import datetime, timezone, date
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Date, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, NUMERIC
from app.core.database import Base
import enum


class SubscriptionStatus(str, enum.Enum):
    PAID = "paid"
    PENDING = "pending"
    FAILED = "failed"
    REFUNDED = "refunded"


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    price_monthly: Mapped[float | None] = mapped_column(NUMERIC(10, 2))
    price_yearly: Mapped[float | None] = mapped_column(NUMERIC(10, 2))
    max_tables: Mapped[int] = mapped_column(default=10)
    max_staff_users: Mapped[int] = mapped_column(default=5)
    analytics_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    cross_sell_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    loyalty_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    commission_rate: Mapped[float] = mapped_column(NUMERIC(5, 4), default=0.0000)

    def __repr__(self) -> str:
        return f"<SubscriptionPlan {self.name}>"


class SubscriptionTransaction(Base):
    __tablename__ = "subscription_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False
    )
    amount: Mapped[float] = mapped_column(NUMERIC(10, 2), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(
        SAEnum(SubscriptionStatus, name="subscription_status", create_type=True),
        default=SubscriptionStatus.PENDING,
    )
    payment_ref: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<SubscriptionTransaction {self.restaurant_id} ({self.status})>"
