"""
CheckNow! — Core Configuration
Loads all settings from environment variables using pydantic-settings.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "CheckNow!"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://checknow:checknow@localhost:5432/checknow"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT & Security
    SECRET_KEY: str = "change-me-to-random-64-chars-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 1440  # 24h
    JWT_REFRESH_EXPIRE_DAYS: int = 7
    JWT_STAFF_EXPIRE_MINUTES: int = 720  # 12h

    # AES Encryption (for payment references)
    AES_KEY: str = "change-me-to-32-byte-key-base64="

    # MinIO / S3
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_MENU: str = "menu-images"
    MINIO_BUCKET_PAYMENTS: str = "payment-screenshots"
    MINIO_BUCKET_LOGOS: str = "logos"
    MINIO_BUCKET_QR: str = "qr-codes"
    MINIO_USE_SSL: bool = False

    # BCV API
    BCV_API_URL: str = "https://pydolarve.org/api/v1/dollar?monitor=bcv"
    BCV_CACHE_TTL_HOURS: int = 4

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    @property
    def normalized_database_url(self) -> str:
        """Ensures the DATABASE_URL uses the postgresql+asyncpg:// scheme."""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ["production", "prod", "staging"]

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    # Super Admin
    SUPER_ADMIN_EMAIL: str = "admin@checknow.app"
    SUPER_ADMIN_PASSWORD: str = "change-me-in-production"

    # Sentry
    SENTRY_DSN: str = ""

    # Business Rules
    MAX_FILE_SIZE_MB: int = 5
    SESSION_EXPIRY_HOURS: int = 24
    SPLIT_EXPIRY_MINUTES: int = 5
    SCREENSHOT_PURGE_DAYS: int = 7
    MAX_WS_PER_TABLE: int = 10
    MAX_JOIN_PER_IP_HOUR: int = 5

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
