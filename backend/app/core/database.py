"""
CheckNow! — Database Engine & Session
Async SQLAlchemy with asyncpg for PostgreSQL.
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

# Strip ?pgbouncer=true from DATABASE_URL — asyncpg doesn't recognize it.
# PgBouncer compatibility is handled by prepared_statement_cache_size=0 below.
# Use normalized URL and strip pgbouncer params (asyncpg handling)
_db_url = settings.normalized_database_url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

connect_args = {
    "prepared_statement_cache_size": 0,  # CRITICAL: required for Supabase pooler / PgBouncer
}

# Enable SSL for production environments
if settings.is_production:
    connect_args["ssl"] = True

engine = create_async_engine(
    _db_url,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    echo=settings.DB_ECHO,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=connect_args,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency: yields an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            import logging
            logging.getLogger("app.database").error(f"❌ Database session error: {str(e)}")
            await session.rollback()
            raise e from e
        finally:
            await session.close()


async def init_db():
    """Create all tables (for development only; use Alembic in production)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Dispose the engine connection pool."""
    await engine.dispose()
