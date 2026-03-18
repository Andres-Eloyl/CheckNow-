"""
CheckNow! — Auto Purge Service
Background task to periodically clean up expired data:
- Expired split assignments
- Stale "locked" order items (e.g., related to expired splits or failed payments)
"""

import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.models.split import SplitAssignment
from app.models.order import OrderItem
from app.websockets.manager import ws_manager

logger = logging.getLogger(__name__)


async def purge_expired_splits(db: AsyncSession):
    """
    Finds split assignments that have expired, deletes them, 
    and unlocks the corresponding order items.
    """
    now = datetime.now(timezone.utc)
    
    # Find expired and unaccepted splits
    result = await db.execute(
        select(SplitAssignment).where(
            SplitAssignment.accepted == False,
            SplitAssignment.expires_at < now
        )
    )
    expired_splits = result.scalars().all()
    
    if not expired_splits:
        return

    expired_ids = [s.id for s in expired_splits]
    order_item_ids = list(set([str(s.order_item_id) for s in expired_splits]))

    logger.info(f"Purging {len(expired_ids)} expired split assignments.")

    # Note: We need to figure out which session(s) they belonged to to broadcast the event
    # Using a simple subquery or joining isn't strictly needed if we just unlock
    
    # 1. Unlock the items
    await db.execute(
        update(OrderItem)
        .where(OrderItem.id.in_(order_item_ids))
        .values(is_locked=False)
    )

    # 2. Delete the assignments
    await db.execute(
        delete(SplitAssignment).where(SplitAssignment.id.in_(expired_ids))
    )
    
    await db.commit()

    # In a full implementation, we'd find the tokens of the sessions involved 
    # and broadcast a "split_expired" event so UI unlocks the items immediately.
    # For MVP, UI can poll or handle the 400 error.
    logger.info(f"Successfully unlocked {len(order_item_ids)} order items.")


async def run_purge_job():
    """Infinite loop that runs the purge tasks periodically."""
    logger.info("Auto-purge background job started.")
    try:
        while True:
            # Run every 60 seconds
            await asyncio.sleep(60)
            
            try:
                # Use a fresh session dynamically
                async with async_session_maker() as db:
                    await purge_expired_splits(db)
            except Exception as e:
                logger.error(f"Error during auto-purge cycle: {e}")
                
    except asyncio.CancelledError:
        logger.info("Auto-purge background job cancelled.")
