"""
CheckNow! — Tables Router
CRUD operations for restaurant tables and QR code generation.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import qrcode
import io

from app.core.database import get_db
from app.core.dependencies import get_current_restaurant, get_restaurant_id
from app.core.config import get_settings
from app.models.table import Table
from app.schemas.table import TableCreate, TableUpdate, TableResponse

settings = get_settings()
router = APIRouter(tags=["Tables"])


@router.get("/api/{slug}/tables", response_model=List[TableResponse])
async def list_tables(
    slug: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """List all tables for the restaurant."""
    result = await db.execute(
        select(Table)
        .where(Table.restaurant_id == restaurant_id)
        .order_by(Table.number)
    )
    tables = result.scalars().all()
    return [
        TableResponse(
            id=str(t.id),
            number=t.number,
            label=t.label,
            capacity=t.capacity,
            status=t.status.value,
        )
        for t in tables
    ]


@router.post("/api/{slug}/tables", response_model=TableResponse, status_code=201)
async def create_table(
    slug: str,
    data: TableCreate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Create a new table."""
    # Check for duplicate number
    existing = await db.execute(
        select(Table).where(
            Table.restaurant_id == restaurant_id,
            Table.number == data.number,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Table #{data.number} already exists.",
        )

    table = Table(
        restaurant_id=restaurant_id,
        number=data.number,
        label=data.label,
        capacity=data.capacity,
    )
    db.add(table)
    await db.flush()

    return TableResponse(
        id=str(table.id),
        number=table.number,
        label=table.label,
        capacity=table.capacity,
        status=table.status.value,
    )


@router.put("/api/{slug}/tables/{table_id}", response_model=TableResponse)
async def update_table(
    slug: str,
    table_id: str,
    data: TableUpdate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Update a table."""
    result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.restaurant_id == restaurant_id,
        )
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found.")

    if data.label is not None:
        table.label = data.label
    if data.capacity is not None:
        table.capacity = data.capacity

    return TableResponse(
        id=str(table.id),
        number=table.number,
        label=table.label,
        capacity=table.capacity,
        status=table.status.value,
    )


@router.delete("/api/{slug}/tables/{table_id}")
async def delete_table(
    slug: str,
    table_id: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Delete a table (only if free)."""
    result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.restaurant_id == restaurant_id,
        )
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found.")

    if table.status.value != "free":
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a table that has an active session.",
        )

    await db.delete(table)
    return {"detail": f"Table #{table.number} deleted."}


@router.get("/api/{slug}/tables/{table_id}/qr")
async def get_table_qr(
    slug: str,
    table_id: str,
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """Generate and return the QR code PNG for a table."""
    result = await db.execute(
        select(Table).where(
            Table.id == table_id,
            Table.restaurant_id == restaurant_id,
        )
    )
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found.")

    # Build the permanent QR URL
    qr_url = f"https://checknow.app/r/{slug}/t/{table_id}"

    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # Return as PNG stream
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=mesa-{table.number}-qr.png"},
    )
