"""
CheckNow! — Middleware
Tenant resolver, rate limiter, and CORS configuration.
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import select
from app.core.database import async_session_factory
from app.core.redis import get_redis
from app.core.config import get_settings
import time

settings = get_settings()


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Extracts the restaurant slug from the URL path and resolves it to a restaurant_id.
    Injects `request.state.restaurant_id` and `request.state.slug` for downstream use.
    
    Skips resolution for paths that don't require a tenant:
    - /health, /docs, /openapi.json, /api/auth/*, /api/admin/*, /api/rates/*
    """

    SKIP_PREFIXES = (
        "/health", "/docs", "/openapi.json", "/redoc",
        "/api/auth/", "/api/admin/", "/api/rates/",
        "/api/restaurants/", "/r/",
    )

    EXACT_SKIP = ("/",)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Skip tenant resolution for non-tenant routes
        if path in self.EXACT_SKIP or any(
            path.startswith(prefix) for prefix in self.SKIP_PREFIXES
        ):
            return await call_next(request)

        # Extract slug from path: /api/{slug}/...
        parts = path.split("/")
        slug = None
        if len(parts) >= 3 and parts[1] == "api":
            slug = parts[2]

        # Also check WebSocket paths: /ws/session/... or /ws/dashboard/{slug}
        if slug is None and len(parts) >= 3 and parts[1] == "ws":
            if parts[2] == "dashboard" and len(parts) >= 4:
                slug = parts[3]

        if slug:
            # Resolve slug to restaurant_id
            try:
                from app.models.restaurant import Restaurant
                async with async_session_factory() as session:
                    result = await session.execute(
                        select(Restaurant.id, Restaurant.is_active)
                        .where(Restaurant.slug == slug)
                    )
                    restaurant = result.first()
    
                    if restaurant is None:
                        return self._json_error(404, f"Restaurant '{slug}' not found")
    
                    if not restaurant.is_active:
                        return self._json_error(403, "Restaurant account is suspended")
    
                    request.state.restaurant_id = str(restaurant.id)
                    request.state.slug = slug
            except Exception as e:
                import logging
                logger = logging.getLogger("app.middleware")
                error_msg = f"Database error during tenant resolution for '{slug}': {str(e)}"
                logger.error(f"❌ {error_msg}")
                return self._json_error(500, error_msg)
        else:
            request.state.restaurant_id = None
            request.state.slug = None

        return await call_next(request)

    @staticmethod
    def _json_error(status_code: int, message: str):
        from starlette.responses import JSONResponse
        return JSONResponse(
            status_code=status_code,
            content={"detail": message},
        )


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting per tenant using Redis sliding window.
    Limits: RATE_LIMIT_PER_MINUTE requests per restaurant per minute.
    """

    async def dispatch(self, request: Request, call_next):
        # Only rate limit tenant-specific routes
        restaurant_id = getattr(request.state, "restaurant_id", None)
        if restaurant_id is None:
            return await call_next(request)

        redis = await get_redis()
        key = f"ratelimit:{restaurant_id}"
        current_minute = int(time.time() // 60)
        full_key = f"{key}:{current_minute}"

        try:
            count = await redis.incr(full_key)
            if count == 1:
                await redis.expire(full_key, 120)  # Expire after 2 minutes

            if count > settings.RATE_LIMIT_PER_MINUTE:
                from starlette.responses import JSONResponse
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Try again later."},
                )
        except Exception:
            # If Redis is down, allow the request through
            pass

        return await call_next(request)
