"""
CheckNow! — Dashboard WebSocket Channel
Real-time connection for staff tablets/dashboard.
"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_token
from app.models.restaurant import Restaurant
from app.websockets.manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websockets"])


@router.websocket("/ws/dashboard/{slug}")
async def websocket_dashboard_endpoint(
    websocket: WebSocket,
    slug: str,
    token: str = Query(..., description="Staff JWT token for authentication"),
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket connection for a restaurant dashboard.
    Requires staff JWT token in the query params (?token=...).
    """
    # 1. Authenticate via token
    payload = decode_token(token)
    if not payload or payload.get("type") not in ("staff", "access"):
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    # Verify user's staff role is related to this restaurant mathematically by resolving slug
    # Find restaurant
    result = await db.execute(select(Restaurant).where(Restaurant.slug == slug))
    restaurant = result.scalars().first()
    
    if not restaurant or str(restaurant.id) != payload.get("restaurant_id"):
        await websocket.close(code=4003, reason="Unauthorized for this restaurant")
        return

    channel_name = f"ws:dashboard:{slug}"

    # 2. Accept connection
    await ws_manager.connect(websocket, channel_name)
    logger.info(f"New Staff Dashboard WS connection to {channel_name}")

    try:
        # Message loop
        while True:
            # Staff dashboard usually only receives data, but occasionally sends pings
            data = await websocket.receive_json()
            if data.get("event") == "ping":
                await websocket.send_json({"event": "pong", "data": {}})
                
    except WebSocketDisconnect:
        logger.info(f"Staff Dashboard WS disconnected from {channel_name}")
    except Exception as e:
        logger.error(f"WS Error in {channel_name}: {e}")
    finally:
        ws_manager.disconnect(websocket, channel_name)
