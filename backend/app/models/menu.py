"""
CheckNow! — Menu Models (Category, Item, Modifier)
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, NUMERIC, JSONB
from app.core.database import Base


class ItemDestination(str, enum.Enum):
    KITCHEN = "kitchen"
    BAR = "bar"
    BOTH = "both"


class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    icon: Mapped[str | None] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship(back_populates="menu_categories")
    items: Mapped[list["MenuItem"]] = relationship(
        back_populates="category", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<MenuCategory {self.name}>"


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_categories.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    price_usd: Mapped[float] = mapped_column(NUMERIC(10, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    destination: Mapped[ItemDestination] = mapped_column(
        SAEnum(ItemDestination, name="item_destination", create_type=True),
        default=ItemDestination.KITCHEN,
    )
    prep_time_min: Mapped[int] = mapped_column(Integer, default=15)
    sku: Mapped[str | None] = mapped_column(String(50))
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    stock_count: Mapped[int | None] = mapped_column(Integer)  # NULL = unlimited
    tags: Mapped[dict] = mapped_column(JSONB, default=lambda: [])
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    category: Mapped["MenuCategory"] = relationship(back_populates="items")
    modifiers: Mapped[list["MenuItemModifier"]] = relationship(
        back_populates="item", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<MenuItem {self.name} (${self.price_usd})>"


class MenuItemModifier(Base):
    __tablename__ = "menu_item_modifiers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    extra_price: Mapped[float] = mapped_column(NUMERIC(10, 2), default=0.00)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    item: Mapped["MenuItem"] = relationship(back_populates="modifiers")

    def __repr__(self) -> str:
        return f"<MenuItemModifier {self.name} (+${self.extra_price})>"


from app.models.restaurant import Restaurant  # noqa: E402
