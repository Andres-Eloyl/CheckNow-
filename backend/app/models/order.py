"""
CheckNow! — Order Items Model
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, NUMERIC, JSONB
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_sessions.id"), nullable=False, index=True
    )
    session_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("session_users.id"), nullable=False, index=True
    )
    menu_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(NUMERIC(10, 2), nullable=False)
    modifiers: Mapped[dict] = mapped_column(JSONB, default=lambda: [])
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus, name="order_status", create_type=True),
        default=OrderStatus.PENDING,
    )
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    session: Mapped["TableSession"] = relationship(back_populates="orders")
    session_user: Mapped["SessionUser"] = relationship(back_populates="orders")
    menu_item: Mapped["MenuItem"] = relationship(lazy="selectin")
    split_assignments: Mapped[list["SplitAssignment"]] = relationship(
        back_populates="order_item", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<OrderItem {self.menu_item_id} x{self.quantity} ({self.status})>"


from app.models.session import TableSession, SessionUser  # noqa: E402
from app.models.menu import MenuItem  # noqa: E402
from app.models.split import SplitAssignment  # noqa: E402
