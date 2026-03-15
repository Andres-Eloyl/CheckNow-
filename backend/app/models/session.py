"""
CheckNow! — Session Models (TableSession + SessionUser)
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, NUMERIC
from app.core.database import Base


class SessionStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSING = "closing"
    CLOSED = "closed"


class TableSession(Base):
    __tablename__ = "table_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    table_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tables.id"), nullable=False, index=True
    )
    token: Mapped[str] = mapped_column(
        String(512), unique=True, nullable=False, index=True
    )
    opened_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("staff_users.id"), nullable=False
    )
    closed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("staff_users.id")
    )
    opened_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_amount: Mapped[float] = mapped_column(NUMERIC(10, 2), default=0.00)
    tax_collected: Mapped[float] = mapped_column(NUMERIC(10, 2), default=0.00)
    tip_collected: Mapped[float] = mapped_column(NUMERIC(10, 2), default=0.00)
    status: Mapped[SessionStatus] = mapped_column(
        SAEnum(SessionStatus, name="session_status", create_type=True),
        default=SessionStatus.OPEN,
    )

    # Relationships
    table: Mapped["Table"] = relationship(back_populates="sessions")
    users: Mapped[list["SessionUser"]] = relationship(
        back_populates="session", lazy="selectin"
    )
    orders: Mapped[list["OrderItem"]] = relationship(
        back_populates="session", lazy="selectin"
    )
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="session", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<TableSession {self.token[:12]}... ({self.status})>"


class SessionUser(Base):
    __tablename__ = "session_users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_sessions.id"), nullable=False, index=True
    )
    alias: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False)
    emoji: Mapped[str | None] = mapped_column(String(10))
    phone_hash: Mapped[str | None] = mapped_column(String(64))
    loyalty_account_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("loyalty_accounts.id")
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    session: Mapped["TableSession"] = relationship(back_populates="users")
    orders: Mapped[list["OrderItem"]] = relationship(
        back_populates="session_user", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<SessionUser {self.alias} ({self.emoji})>"


from app.models.table import Table  # noqa: E402
from app.models.order import OrderItem  # noqa: E402
from app.models.payment import Payment  # noqa: E402
from app.models.loyalty import LoyaltyAccount  # noqa: E402
