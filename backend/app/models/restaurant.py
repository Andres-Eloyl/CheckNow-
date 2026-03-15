"""
CheckNow! — Restaurant & Config Models
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    String, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, NUMERIC
from app.core.database import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    country: Mapped[str] = mapped_column(String(3), nullable=False, default="VE")
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="America/Caracas")
    plan_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subscription_plans.id")
    )
    subscription_ends: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    trial_ends: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    config: Mapped["RestaurantConfig"] = relationship(
        back_populates="restaurant", uselist=False, lazy="selectin"
    )
    tables: Mapped[list["Table"]] = relationship(back_populates="restaurant", lazy="selectin")
    staff: Mapped[list["StaffUser"]] = relationship(back_populates="restaurant", lazy="selectin")
    menu_categories: Mapped[list["MenuCategory"]] = relationship(
        back_populates="restaurant", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Restaurant {self.slug}: {self.name}>"


class RestaurantConfig(Base):
    __tablename__ = "restaurants_config"

    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), primary_key=True
    )
    tax_rate: Mapped[float] = mapped_column(NUMERIC(5, 4), default=0.1600)
    service_charge: Mapped[float] = mapped_column(NUMERIC(5, 4), default=0.1000)
    currency_primary: Mapped[str] = mapped_column(String(3), default="USD")
    accepted_methods: Mapped[list] = mapped_column(
        JSONB, default=lambda: ["pago_movil", "zelle", "efectivo"]
    )
    primary_color: Mapped[str] = mapped_column(String(7), default="#6C63FF")
    secondary_color: Mapped[str] = mapped_column(String(7), default="#FF6B35")
    logo_url: Mapped[str | None] = mapped_column(String(500))
    wifi_ssid: Mapped[str | None] = mapped_column(String(100))
    cross_sell_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    loyalty_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship(back_populates="config")

    def __repr__(self) -> str:
        return f"<RestaurantConfig for {self.restaurant_id}>"


# Avoid circular import: import names for type checking
from app.models.table import Table  # noqa: E402
from app.models.staff import StaffUser  # noqa: E402
from app.models.menu import MenuCategory  # noqa: E402
