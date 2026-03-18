"""
CheckNow! — WebSocket Manager
Handles connection states and Redis Pub/Sub for multi-instance broadcasting.
"""

import asyncio
import json
import logging
from typing import Dict, List, Any
from fastapi import WebSocket
from app.core.redis import get_redis

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Maps channel_name -> list of WebSocket connections active on THIS instance
        # Format for session: ws:session:{token}
        # Format for dashboard: ws:dashboard:{slug}
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.pubsub: Any = None
        self.pubsub_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket, channel: str):
        """Accept a connection and add it to the local pool."""
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        logger.info(f"Connected WS to {channel}. Total in channel on this node: {len(self.active_connections[channel])}")

    def disconnect(self, websocket: WebSocket, channel: str):
        """Remove a connection from the local pool."""
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)
            if not self.active_connections[channel]:
                self.active_connections.pop(channel, None)

    async def broadcast_local(self, channel: str, message: dict):
        """Send a JSON message to all clients connected to this exact Node/Process."""
        if channel in self.active_connections:
            dead_sockets = []
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send WS message on {channel}: {e}")
                    dead_sockets.append(connection)
            
            # Cleanup dead sockets
            for dead in dead_sockets:
                self.disconnect(dead, channel)

    async def broadcast(self, channel: str, message: dict):
        """
        Publish a message to Redis so ALL nodes receive it.
        This is the method endpoints should use to send realtime updates.
        """
        redis = await get_redis()
        # Ensure we don't block
        payload = json.dumps(message)
        await redis.publish(channel, payload)

    async def _pubsub_listener(self):
        """
        Background task that listens to the Redis Pub/Sub channel
        and routes incoming messages to local WebSocket clients.
        """
        redis = await get_redis()
        pubsub = redis.pubsub()
        self.pubsub = pubsub
        # Listen to all checknow WS channels
        await pubsub.psubscribe("ws:*")
        
        logger.info("Started Redis Pub/Sub listener for CheckNow! WS events")
        try:
            async for message in pubsub.listen():
                if message["type"] == "pmessage":
                    channel = message["channel"]
                    data = message["data"]
                    try:
                        payload = json.loads(data)
                        await self.broadcast_local(channel, payload)
                    except json.JSONDecodeError:
                        logger.error(f"Failed to decode Redis WS message from {channel}: {data}")
                    except Exception as e:
                        logger.error(f"Error broadcasting local message for {channel}: {e}")
        except asyncio.CancelledError:
            logger.info("Redis Pub/Sub WS listener cancelled (shutting down)")
        finally:
            if self.pubsub:
                await self.pubsub.close()

    async def startup(self):
        """Start the background Redis listener task. Call this during FastAPI lifespan."""
        self.pubsub_task = asyncio.create_task(self._pubsub_listener())

    async def shutdown(self):
        """Stop the background listener. Call this during FastAPI lifespan."""
        if self.pubsub_task:
            self.pubsub_task.cancel()
            try:
                await self.pubsub_task
            except asyncio.CancelledError:
                pass


# Global singleton instance
ws_manager = ConnectionManager()
