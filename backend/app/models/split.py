"""
CheckNow! — Split Assignments Model
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, NUMERIC
from app.core.database import Base


class SplitAssignment(Base):
    __tablename__ = "split_assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("order_items.id"), nullable=False, index=True
    )
    requested_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("session_users.id"), nullable=False
    )
    session_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("session_users.id"), nullable=False, index=True
    )
    fraction: Mapped[float] = mapped_column(NUMERIC(5, 4), nullable=False)
    amount_owed: Mapped[float] = mapped_column(NUMERIC(10, 2), nullable=False)
    accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    declined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    order_item: Mapped["OrderItem"] = relationship(back_populates="split_assignments")

    def __repr__(self) -> str:
        return f"<SplitAssignment {self.fraction*100}% = ${self.amount_owed} (accepted={self.accepted})>"


from app.models.order import OrderItem  # noqa: E402
