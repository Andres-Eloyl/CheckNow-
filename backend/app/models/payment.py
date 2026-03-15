"""
CheckNow! — Payment & Exchange Rate Models
"""

import uuid
import enum
from datetime import datetime, timezone, date as date_type
from sqlalchemy import String, DateTime, ForeignKey, Text, Date, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, NUMERIC, JSONB
from app.core.database import Base


class PaymentCurrency(str, enum.Enum):
    USD = "USD"
    VES = "VES"
    COP = "COP"


class PaymentMethod(str, enum.Enum):
    PAGO_MOVIL = "pago_movil"
    ZELLE = "zelle"
    EFECTIVO = "efectivo"
    TARJETA = "tarjeta"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_sessions.id"), nullable=False, index=True
    )
    session_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("session_users.id"), nullable=False
    )
    amount_usd: Mapped[float] = mapped_column(NUMERIC(10, 2), nullable=False)
    amount_local: Mapped[float | None] = mapped_column(NUMERIC(10, 2))
    currency: Mapped[PaymentCurrency] = mapped_column(
        SAEnum(PaymentCurrency, name="payment_currency", create_type=True),
        nullable=False,
    )
    exchange_rate: Mapped[float | None] = mapped_column(NUMERIC(15, 4))
    method: Mapped[PaymentMethod] = mapped_column(
        SAEnum(PaymentMethod, name="payment_method", create_type=True),
        nullable=False,
    )
    tip_amount: Mapped[float] = mapped_column(NUMERIC(10, 2), default=0.00)
    reference_code_enc: Mapped[str | None] = mapped_column(String(500))
    screenshot_file_key: Mapped[str | None] = mapped_column(String(500))
    ocr_extracted: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, name="payment_status", create_type=True),
        default=PaymentStatus.PENDING,
    )
    verified_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("staff_users.id")
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejected_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    purge_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    session: Mapped["TableSession"] = relationship(back_populates="payments")

    def __repr__(self) -> str:
        return f"<Payment ${self.amount_usd} via {self.method} ({self.status})>"


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    __table_args__ = (
        UniqueConstraint("date", "source", name="uq_exchange_rate_date_source"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    source: Mapped[str] = mapped_column(String(20), default="bcv")
    usd_to_ves: Mapped[float] = mapped_column(NUMERIC(15, 4), nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<ExchangeRate {self.date}: 1 USD = {self.usd_to_ves} VES>"


from app.models.session import TableSession  # noqa: E402
