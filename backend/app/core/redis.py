"""
CheckNow! — Redis Client
Manages Redis connections for caching and Pub/Sub.
"""

import redis.asyncio as aioredis
from app.core.config import get_settings

settings = get_settings()

redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Get the global Redis client instance."""
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=50,
        )
    return redis_client


async def close_redis():
    """Close the Redis connection pool."""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


async def get_pubsub() -> aioredis.client.PubSub:
    """Create a new Pub/Sub instance for WebSocket event broadcasting."""
    client = await get_redis()
    return client.pubsub()
