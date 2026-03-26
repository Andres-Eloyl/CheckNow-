"""
CheckNow! — Session WebSocket Channel
Real-time connection for comensales at a table.
"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.models.session import TableSession, SessionStatus
from app.websockets.manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websockets"])


async def get_session_snapshot(session_id: str, db: AsyncSession) -> dict:
    """
    Generate a full snapshot of the session state.
    """
    return {
        "users": [],
        "orders": [],
        "balance": {"total": 0, "paid": 0, "remaining": 0}
    }


@router.websocket("/ws/session/{session_token}")
async def websocket_session_endpoint(
    websocket: WebSocket,
    session_token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket connection for a comensal at a table.
    Accepts both JWT session token and tableId (UUID) for matching.
    """
    # 1. Verify session token is valid and active — match by JWT token OR tableId UUID
    result = await db.execute(
        select(TableSession)
        .where(
            or_(TableSession.token == session_token, TableSession.table_id == session_token),
            TableSession.status.in_([SessionStatus.OPEN, SessionStatus.IN_PROGRESS]),
        )
    )
    db_session = result.scalars().first()

    if not db_session:
        await websocket.close(code=4004, reason="Session invalid or closed")
        return

    # Use table_id as channel name so broadcasts from REST endpoints
    # (which use table_id) reach the right subscribers
    channel_name = f"ws:session:{str(db_session.table_id)}"

    # 2. Accept connection and add to manager
    await ws_manager.connect(websocket, channel_name)
    logger.info(f"New WS connection to {channel_name}")

    try:
        # 3. Send initial snapshot immediately (no blocking identify step)
        snapshot = await get_session_snapshot(db_session.id, db)
        await websocket.send_json({
            "event": "snapshot",
            "data": snapshot
        })

        # 4. Message loop — handle pings and optional identify
        while True:
            data = await websocket.receive_json()
            if data.get("event") == "ping":
                await websocket.send_json({"event": "pong", "data": {}})
            elif data.get("event") == "identify":
                # Accept but don't require — backward compatible
                await websocket.send_json({"event": "identified", "data": {}})

    except WebSocketDisconnect:
        logger.info(f"WS disconnected from {channel_name}")
    except Exception as e:
        logger.error(f"WS Error in {channel_name}: {e}")
    finally:
        ws_manager.disconnect(websocket, channel_name)
