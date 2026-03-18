"""
CheckNow! — Main FastAPI Application
Entry point for the backend API server.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sentry_sdk

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.core.redis import get_redis, close_redis
from app.core.middleware import TenantMiddleware, RateLimitMiddleware
from app.websockets.manager import ws_manager

# Import all models to register them with SQLAlchemy
from app.models import *  # noqa: F401, F403

from app.routers import auth, health, restaurants, staff, tables, rates, sessions, menu, orders
from app.websockets import session_ws, dashboard_ws

settings = get_settings()


# ──────────────────────────────────────────────
# Sentry (Error Tracking)
# ──────────────────────────────────────────────
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=0.1,
        environment=settings.ENVIRONMENT,
    )


# ──────────────────────────────────────────────
# App Lifespan (startup/shutdown)
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown events."""
    # Startup
    print(f"🚀 Starting {settings.APP_NAME} ({settings.ENVIRONMENT})")
    if settings.ENVIRONMENT == "development":
        await init_db()
        print("📦 Database tables created (development mode)")

    # Initialize Redis connection
    await get_redis()
    print("🔴 Redis connected")

    # Start WebSocket background task
    await ws_manager.startup()

    yield

    # Shutdown
    await ws_manager.shutdown()
    await close_redis()
    await close_db()
    print(f"👋 {settings.APP_NAME} shut down gracefully")


# ──────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Plataforma SaaS B2B para restaurantes. "
        "Pedidos por QR, carrito colaborativo en tiempo real, "
        "fraccionamiento inteligente de cuentas (Smart Split), "
        "y dashboard operativo."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ──────────────────────────────────────────────
# Middleware (order matters: last added = first executed)
# ──────────────────────────────────────────────

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting (runs after tenant is resolved)
app.add_middleware(RateLimitMiddleware)

# Tenant Resolution (runs first on each request)
app.add_middleware(TenantMiddleware)


# ──────────────────────────────────────────────
# Register Routers
# ──────────────────────────────────────────────
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(restaurants.router)
app.include_router(staff.router)
app.include_router(tables.router)
app.include_router(sessions.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(rates.router)
app.include_router(session_ws.router)
app.include_router(dashboard_ws.router)


# ──────────────────────────────────────────────
# Root
# ──────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }
