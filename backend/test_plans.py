import asyncio
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.subscription import SubscriptionPlan

async def check_plans():
    async with async_session_factory() as db:
        print("🔹 Revisando planes de suscripción...")
        result = await db.execute(select(SubscriptionPlan))
        plans = result.scalars().all()
        for p in plans:
            print(f"- {p.name}: {p.price_monthly} (ID: {p.id})")

if __name__ == "__main__":
    asyncio.run(check_plans())
