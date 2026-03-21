"""
CheckNow! — Security Utilities
JWT token management, password hashing, and AES encryption.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from cryptography.fernet import Fernet
import base64
import hashlib
import secrets

from app.core.config import get_settings

settings = get_settings()

# Passlib removed for Python 3.13 compatibility context

# AES encryption for sensitive data (payment references)
_fernet_key = base64.urlsafe_b64encode(
    settings.AES_KEY.encode()[:32].ljust(32, b"\0")
)
fernet = Fernet(_fernet_key)


# ──────────────────────────────────────────────
# Password Hashing
# ──────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False


def hash_pin(pin: str) -> str:
    """Hash a staff PIN (same as password, but semantically separate)."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pin.encode('utf-8'), salt).decode('utf-8')


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verify a staff PIN against its hash."""
    try:
        return bcrypt.checkpw(plain_pin.encode('utf-8'), hashed_pin.encode('utf-8'))
    except ValueError:
        return False


# ──────────────────────────────────────────────
# JWT Tokens
# ──────────────────────────────────────────────

def create_access_token(
    data: dict,
    expires_minutes: Optional[int] = None,
) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.JWT_ACCESS_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_staff_token(data: dict) -> str:
    """Create a JWT token for staff (shorter-lived)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_STAFF_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire, "type": "staff"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_session_token(session_id: str, table_id: str) -> str:
    """Create a JWT token for a table session (8h max)."""
    to_encode = {
        "session_id": session_id,
        "table_id": table_id,
        "type": "session",
    }
    expire = datetime.now(timezone.utc) + timedelta(hours=8)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token. Returns None if invalid."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


# ──────────────────────────────────────────────
# AES Encryption (for payment references)
# ──────────────────────────────────────────────

def encrypt_reference(plain_text: str) -> str:
    """Encrypt a payment reference code using AES-256 (Fernet)."""
    return fernet.encrypt(plain_text.encode()).decode()


def decrypt_reference(encrypted_text: str) -> str:
    """Decrypt a payment reference code."""
    return fernet.decrypt(encrypted_text.encode()).decode()


# ──────────────────────────────────────────────
# Phone Hash (for loyalty - privacy by design)
# ──────────────────────────────────────────────

def hash_phone(phone: str, restaurant_id: str) -> str:
    """
    Hash a phone number with restaurant-specific salt.
    Uses SHA-256 so the same phone at the same restaurant
    always produces the same hash (for loyalty matching).
    """
    salted = f"{restaurant_id}:{phone}"
    return hashlib.sha256(salted.encode()).hexdigest()


# ──────────────────────────────────────────────
# Color Generator (for session user identification)
# ──────────────────────────────────────────────

COMENSAL_COLORS = [
    "#FF6B35", "#F7931E", "#FFD700", "#00D4AA", "#00B4D8",
    "#6C63FF", "#E040FB", "#FF4081", "#7CB342", "#26C6DA",
    "#AB47BC", "#EC407A", "#42A5F5", "#66BB6A", "#FFA726",
]

COMENSAL_EMOJIS = [
    "🍕", "🍔", "🌮", "🍣", "🍩", "🧁", "🍰", "🥗",
    "🍜", "🥘", "🍝", "🌯", "🥡", "🧆", "🫕", "🍱",
]


def generate_user_color(index: int) -> str:
    """Generate a deterministic color for a session user by join order."""
    return COMENSAL_COLORS[index % len(COMENSAL_COLORS)]


def generate_user_emoji() -> str:
    """Generate a random emoji for a session user."""
    return secrets.choice(COMENSAL_EMOJIS)
