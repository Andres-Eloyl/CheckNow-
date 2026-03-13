"""
CheckNow! — Dependencies
Shared FastAPI dependencies for authentication and authorization.
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.core.database import get_db

security_scheme = HTTPBearer()


async def get_current_restaurant(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    """
    Dependency: validates JWT and returns the payload.
    For restaurant owner/manager auth.
    """
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") not in ("access", "refresh"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


async def get_current_staff(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    """
    Dependency: validates staff JWT and returns the payload.
    For staff (waiter, cashier, manager, owner) auth.
    """
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "staff":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired staff token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def require_role(*allowed_roles: str):
    """
    Dependency factory: restricts access to specific staff roles.
    Usage: Depends(require_role("owner", "manager"))
    """
    async def _check_role(staff: dict = Depends(get_current_staff)):
        if staff.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}",
            )
        return staff
    return _check_role


async def get_restaurant_id(request: Request) -> str:
    """
    Dependency: extracts the restaurant_id from request state.
    Set by TenantMiddleware.
    """
    restaurant_id = getattr(request.state, "restaurant_id", None)
    if not restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found.",
        )
    return restaurant_id
