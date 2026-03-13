"""
CheckNow! — Rates Router
BCV exchange rate endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.payment import ExchangeRate
from app.schemas.payment import ExchangeRateResponse

router = APIRouter(tags=["Exchange Rates"])


@router.get("/api/rates/bcv", response_model=ExchangeRateResponse)
async def get_bcv_rate(db: AsyncSession = Depends(get_db)):
    """Get the latest BCV exchange rate."""
    result = await db.execute(
        select(ExchangeRate)
        .where(ExchangeRate.source == "bcv")
        .order_by(desc(ExchangeRate.fetched_at))
        .limit(1)
    )
    rate = result.scalar_one_or_none()

    if not rate:
        raise HTTPException(
            status_code=503,
            detail="Exchange rate not available. BCV sync may not have run yet.",
        )

    return ExchangeRateResponse(
        date=str(rate.date),
        usd_to_ves=float(rate.usd_to_ves),
        source=rate.source,
        fetched_at=rate.fetched_at,
    )
