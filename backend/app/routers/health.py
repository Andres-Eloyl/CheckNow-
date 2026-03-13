"""
CheckNow! — Health Router
System health checks for Docker and monitoring.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.core.redis import get_redis

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Full health check — database + redis."""
    health = {"status": "ok", "db": "unknown", "redis": "unknown"}

    # Check database
    try:
        await db.execute(text("SELECT 1"))
        health["db"] = "ok"
    except Exception as e:
        health["db"] = f"error: {str(e)}"
        health["status"] = "degraded"

    # Check Redis
    try:
        redis = await get_redis()
        await redis.ping()
        health["redis"] = "ok"
    except Exception as e:
        health["redis"] = f"error: {str(e)}"
        health["status"] = "degraded"

    status_code = 200 if health["status"] == "ok" else 503
    return health


@router.get("/health/ready")
async def readiness_check():
    """Simple readiness probe for Docker/Kubernetes."""
    return {"status": "ready"}
