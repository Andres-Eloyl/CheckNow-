"""
CheckNow! — Session WebSocket Channel
Real-time connection for comensales at a table.
"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.session import TableSession, SessionStatus
from app.websockets.manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websockets"])


async def get_session_snapshot(session_id: str, db: AsyncSession) -> dict:
    """
    Generate a full snapshot of the session state.
    This includes users, orders, and balance.
    For now, it returns a stub that will be expanded when orders are implemented.
    """
    # TODO: Expand this when OrderItem and Split models are ready
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
    """
    # 1. Verify session token is valid and active
    result = await db.execute(
        select(TableSession)
        .where(
            TableSession.token == session_token,
            TableSession.status.in_([SessionStatus.OPEN, SessionStatus.IN_PROGRESS]),
        )
    )
    db_session = result.scalars().first()

    if not db_session:
        # Session invalid or closed, reject connection
        await websocket.close(code=4004, reason="Session invalid or closed")
        return

    channel_name = f"ws:session:{session_token}"

    # 2. Accept connection and add to manager
    await ws_manager.connect(websocket, channel_name)
    logger.info(f"New WS connection to {channel_name}")

    try:
        # Wait for the first message to identify the user
        auth_message = await websocket.receive_json()
        if auth_message.get("event") != "identify":
            await websocket.close(code=4003, reason="Expected identify event")
            return
            
        session_user_id = auth_message.get("data", {}).get("session_user_id")
        if not session_user_id:
            await websocket.close(code=4003, reason="Missing session_user_id")
            return
            
        # Optional: verify session_user_id exists here
        
        # 3. Send initial snapshot
        snapshot = await get_session_snapshot(db_session.id, db)
        await websocket.send_json({
            "event": "snapshot",
            "data": snapshot
        })

        # 4. Message loop
        while True:
            # Comensales don't send much to the server via WS (mostly via REST)
            # They only send pings
            data = await websocket.receive_json()
            if data.get("event") == "ping":
                await websocket.send_json({"event": "pong", "data": {}})
                
    except WebSocketDisconnect:
        logger.info(f"WS disconnected from {channel_name}")
    except Exception as e:
        logger.error(f"WS Error in {channel_name}: {e}")
    finally:
        ws_manager.disconnect(websocket, channel_name)
