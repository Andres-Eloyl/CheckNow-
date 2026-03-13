"""
CheckNow! — Staff Router
CRUD operations for staff members.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_restaurant, get_restaurant_id
from app.core.security import hash_pin
from app.models.staff import StaffUser, StaffRole
from app.schemas.staff import StaffCreate, StaffUpdate, StaffResponse

router = APIRouter(tags=["Staff"])


@router.get("/api/{slug}/staff", response_model=List[StaffResponse])
async def list_staff(
    slug: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """List all staff members."""
    result = await db.execute(
        select(StaffUser)
        .where(StaffUser.restaurant_id == restaurant_id)
        .order_by(StaffUser.created_at)
    )
    staff = result.scalars().all()
    return [
        StaffResponse(id=str(s.id), name=s.name, role=s.role.value, is_active=s.is_active)
        for s in staff
    ]


@router.post("/api/{slug}/staff", response_model=StaffResponse, status_code=201)
async def create_staff(
    slug: str,
    data: StaffCreate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Create a new staff member."""
    # Validate role
    try:
        role = StaffRole(data.role)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {[r.value for r in StaffRole]}",
        )

    staff = StaffUser(
        restaurant_id=restaurant_id,
        name=data.name,
        pin_hash=hash_pin(data.pin),
        role=role,
    )
    db.add(staff)
    await db.flush()

    return StaffResponse(
        id=str(staff.id), name=staff.name, role=staff.role.value, is_active=staff.is_active
    )


@router.put("/api/{slug}/staff/{staff_id}", response_model=StaffResponse)
async def update_staff(
    slug: str,
    staff_id: str,
    data: StaffUpdate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Update a staff member."""
    result = await db.execute(
        select(StaffUser).where(
            StaffUser.id == staff_id,
            StaffUser.restaurant_id == restaurant_id,
        )
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    if data.name is not None:
        staff.name = data.name
    if data.pin is not None:
        staff.pin_hash = hash_pin(data.pin)
    if data.role is not None:
        try:
            staff.role = StaffRole(data.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role.")
    if data.is_active is not None:
        staff.is_active = data.is_active

    return StaffResponse(
        id=str(staff.id), name=staff.name, role=staff.role.value, is_active=staff.is_active
    )


@router.delete("/api/{slug}/staff/{staff_id}")
async def deactivate_staff(
    slug: str,
    staff_id: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_restaurant),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a staff member (soft delete)."""
    result = await db.execute(
        select(StaffUser).where(
            StaffUser.id == staff_id,
            StaffUser.restaurant_id == restaurant_id,
        )
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    staff.is_active = False
    return {"detail": f"Staff member '{staff.name}' deactivated."}
