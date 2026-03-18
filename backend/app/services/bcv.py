"""
CheckNow! — BCV Exchange Rate Service
Scrapes the official exchange rate from the Central Bank of Venezuela (BCV).
"""

import httpx
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.payment import ExchangeRate

logger = logging.getLogger(__name__)

# Fallback rate if scrape fails completely and DB is empty
FALLBACK_RATE = 55.40 


async def fetch_bcv_rate() -> Optional[float]:
    """
    Fetches the USD to VES exchange rate from the official BCV website.
    Uses httpx and BeautifulSoup4.
    """
    try:
        url = "https://www.bcv.org.ve/"
        
        # Verify=False might be needed depending on BCV's SSL cert status, 
        # but try with True first for security.
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            response = await client.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            
            # The BCV website usually uses an ID 'dolar'
            # <div id="dolar">
            #   <div class="col-sm-6 col-xs-6 centrado"> 
            #       <strong>55,40000000</strong>
            #   </div>
            # </div>
            dolar_div = soup.find(id="dolar")
            if not dolar_div:
                logger.error("Could not find the 'dolar' element on the BCV website.")
                return None

            strong_tag = dolar_div.find("strong")
            if not strong_tag:
                logger.error("Could not find the 'strong' tag containing the rate.")
                return None

            # Rate format: 55,40000000 -> need to replace comma with dot
            rate_str = strong_tag.text.strip().replace(",", ".")
            rate = float(rate_str)
            
            logger.info(f"Successfully scraped BCV rate: {rate}")
            return rate

    except Exception as e:
        logger.error(f"Failed to scrape BCV rate: {e}")
        return None


async def get_current_rate(db: AsyncSession) -> float:
    """
    Gets the current valid exchange rate.
    Flow:
    1. Check if we have today's rate in the database.
    2. If not, scrape it from BCV.
    3. If scrape fails, use the latest from the database.
    4. If DB is empty, use the hardcoded fallback.
    """
    today_local = datetime.now(timezone(timedelta(hours=-4))).date() # VET timezone
    
    # 1. Check database for today's rate
    result = await db.execute(
        select(ExchangeRate)
        .where(ExchangeRate.date == today_local)
    )
    today_rate_db = result.scalars().first()
    
    if today_rate_db:
        return float(today_rate_db.usd_to_ves)

    # 2. Scrape BCV
    scraped_rate = await fetch_bcv_rate()
    
    if scraped_rate is not None:
        # Save to DB
        new_rate = ExchangeRate(
            date=today_local,
            source="bcv",
            usd_to_ves=scraped_rate
        )
        db.add(new_rate)
        # Attempt to commit, but quietly catch if a concurrent request already did it
        try:
            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.warning(f"Could not save scraped BCV rate (possible race condition): {e}")

        return scraped_rate

    # 3. If scrape failed, get the most recent one from DB as fallback
    logger.warning("Falling back to most recent offline exchange rate from DB")
    result_latest = await db.execute(
        select(ExchangeRate)
        .order_by(ExchangeRate.date.desc())
        .limit(1)
    )
    latest_db_rate = result_latest.scalars().first()
    
    if latest_db_rate:
        return float(latest_db_rate.usd_to_ves)
        
    # 4. Ultimate fallback
    logger.critical(f"Ultimate fallback: using hardcoded BCV rate {FALLBACK_RATE}")
    return FALLBACK_RATE
