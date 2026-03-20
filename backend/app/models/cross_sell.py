"""
CheckNow! — Cross-Sell Rule Model
Reglas de venta cruzada: "Si piden item A, sugerir item B".
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class CrossSellRule(Base):
    __tablename__ = "cross_sell_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False, index=True
    )
    # El item que dispara la sugerencia
    trigger_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False, index=True
    )
    # El item sugerido
    suggested_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False
    )
    # Prioridad (más alto = se muestra primero)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    # Mensaje personalizado (ej: "¡Combo perfecto!")
    message: Mapped[str | None] = mapped_column(String(200))
    # Descuento opcional en % si compran el sugerido (ej: 0.10 = 10%)
    discount_pct: Mapped[float] = mapped_column(Float, default=0.0)
    # Control
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<CrossSellRule {self.trigger_item_id} → {self.suggested_item_id}>"
