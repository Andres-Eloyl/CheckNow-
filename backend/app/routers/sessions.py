"""
CheckNow! — Sessions Router
Handles the lifecycle of a table session (open, join, close).
"""

import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_

from app.core.database import get_db
from app.core.dependencies import get_restaurant_id, get_current_staff
from app.core.security import create_session_token, generate_user_color, generate_user_emoji
from app.models.session import TableSession, SessionUser, SessionStatus
from app.models.table import Table, TableStatus
from app.schemas.session import (
    SessionCreate,
    SessionJoin,
    SessionResponse,
    SessionUserResponse,
)

router = APIRouter(prefix="/api/{slug}/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def open_session(
    slug: str,
    session_in: SessionCreate,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """
    Open a new session for a table.
    Requires staff authentication.
    """
    # 1. Get the table and verify it belongs to the restaurant
    result = await db.execute(
        select(Table).where(
            Table.id == session_in.table_id, Table.restaurant_id == restaurant_id
        )
    )
    table = result.scalars().first()

    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Table not found"
        )

    # 2. Check if table is available
    if table.status != TableStatus.FREE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Table is currently {table.status.value}",
        )

    # 3. Create session details
    session_uuid = uuid.uuid4()
    # Generate the JWT token for this session (valid for 8 hours)
    token = create_session_token(str(session_uuid), str(table.id))
    
    # Expiration is handled by the JWT, but we also store it in DB
    expires_at = datetime.now(timezone.utc) + timedelta(hours=8)

    # Only set opened_by if the token is from a staff user
    # Owner "access" tokens have sub=restaurant_id which is not a valid staff_users FK
    staff_id = current_user["sub"] if current_user.get("type") == "staff" else None

    db_session = TableSession(
        id=session_uuid,
        table_id=table.id,
        token=token,
        opened_by=staff_id,
        expires_at=expires_at,
        status=SessionStatus.OPEN,
    )

    db.add(db_session)

    # 4. Update table status
    table.status = TableStatus.ACTIVE

    await db.commit()
    await db.refresh(db_session)

    # Prepare response — use Pydantic model_validate for proper nested serialization
    db_session.table_number = table.number  # type: ignore[attr-defined]
    return SessionResponse.model_validate(db_session, from_attributes=True).model_dump()


@router.get("/{token}", response_model=SessionResponse)
async def get_session(
    slug: str,
    token: str,
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Get info about an active session via its token.
    Public endpoint for comensales who scanned the QR.
    """
    result = await db.execute(
        select(TableSession, Table)
        .join(Table, TableSession.table_id == Table.id)
        .where(
            or_(TableSession.token == token, TableSession.table_id == token),
            Table.restaurant_id == restaurant_id,
            TableSession.status.in_([SessionStatus.OPEN, SessionStatus.IN_PROGRESS]),
        )
    )
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found, expired, or closed",
        )

    db_session, table = row
    
    db_session.table_number = table.number  # type: ignore[attr-defined]
    return SessionResponse.model_validate(db_session, from_attributes=True).model_dump()


@router.post("/{token}/join", response_model=SessionUserResponse, status_code=status.HTTP_201_CREATED)
async def join_session(
    slug: str,
    token: str,
    join_in: SessionJoin,
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Join an active table session.
    Assigns a color and emoji to the user.
    """
    # Verify session is active and belongs to this restaurant
    result = await db.execute(
        select(TableSession)
        .join(Table, TableSession.table_id == Table.id)
        .where(
            or_(TableSession.token == token, TableSession.table_id == token),
            Table.restaurant_id == restaurant_id,
            TableSession.status.in_([SessionStatus.OPEN, SessionStatus.IN_PROGRESS]),
        )
    )
    db_session = result.scalars().first()

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session is invalid or closed",
        )

    # Count current users to determine color index
    users_result = await db.execute(
        select(SessionUser).where(SessionUser.session_id == db_session.id)
    )
    current_users = users_result.scalars().all()
    user_index = len(current_users)

    # Create new session user
    new_user = SessionUser(
        session_id=db_session.id,
        alias=join_in.alias,
        color=generate_user_color(user_index),
        emoji=generate_user_emoji(),
    )

    db.add(new_user)
    
    # If this is the first user, change status to IN_PROGRESS
    if db_session.status == SessionStatus.OPEN:
        db_session.status = SessionStatus.IN_PROGRESS

    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/{token}/close", response_model=SessionResponse)
async def close_session(
    slug: str,
    token: str,
    restaurant_id: str = Depends(get_restaurant_id),
    current_user: dict = Depends(get_current_staff),
    db: AsyncSession = Depends(get_db),
):
    """
    Close an active session and free the table.
    Requires staff authentication.
    """
    result = await db.execute(
        select(TableSession, Table)
        .join(Table, TableSession.table_id == Table.id)
        .where(
            or_(TableSession.token == token, TableSession.table_id == token),
            Table.restaurant_id == restaurant_id,
            TableSession.status != SessionStatus.CLOSED
        )
    )
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    db_session, table = row

    if db_session.status == SessionStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Session is already closed"
        )

    # Process closing
    db_session.status = SessionStatus.CLOSED
    db_session.closed_by = current_user["sub"]
    db_session.closed_at = datetime.now(timezone.utc)
    
    table.status = TableStatus.FREE

    await db.commit()
    await db.refresh(db_session)

    db_session.table_number = table.number  # type: ignore[attr-defined]
    return SessionResponse.model_validate(db_session, from_attributes=True).model_dump()


@router.get("/{token}/users", response_model=list[SessionUserResponse])
async def get_session_users(
    slug: str,
    token: str,
    restaurant_id: str = Depends(get_restaurant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all users currently in the session.
    """
    # Verify session
    result = await db.execute(
        select(TableSession.id)
        .join(Table, TableSession.table_id == Table.id)
        .where(
            or_(TableSession.token == token, TableSession.table_id == token),
            Table.restaurant_id == restaurant_id,
            TableSession.status != SessionStatus.CLOSED
        )
    )
    session_id = result.scalars().first()

    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    # Get users
    users_result = await db.execute(
        select(SessionUser).where(SessionUser.session_id == session_id)
    )
    return users_result.scalars().all()
