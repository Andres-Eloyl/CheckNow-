"""
CheckNow! — Table Model
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class TableStatus(str, enum.Enum):
    FREE = "free"
    ACTIVE = "active"
    ORDERING = "ordering"
    SERVING = "serving"
    CLOSING = "closing"


class Table(Base):
    __tablename__ = "tables"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "number", name="uq_table_restaurant_number"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True
    )
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str | None] = mapped_column(String(50))
    capacity: Mapped[int] = mapped_column(Integer, default=4)
    status: Mapped[TableStatus] = mapped_column(
        SAEnum(TableStatus, name="table_status", create_type=True),
        default=TableStatus.FREE,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship(back_populates="tables")
    sessions: Mapped[list["TableSession"]] = relationship(
        back_populates="table", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Table #{self.number} ({self.status})>"


from app.models.restaurant import Restaurant  # noqa: E402
from app.models.session import TableSession  # noqa: E402
