import asyncio
from sqlalchemy import text
from app.core.database import async_session_factory

async def check_tables():
    async with async_session_factory() as db:
        print("🔹 Revisando tablas en Supabase...")
        try:
            # Intentar consultar subscription_plans
            await db.execute(text("SELECT id FROM subscription_plans LIMIT 1"))
            print("✅ Tabla 'subscription_plans' EXISTE.")
        except Exception as e:
            print("❌ Tabla 'subscription_plans' NO EXISTE o falló:", e)
            
        try:
            # Intentar consultar analytics_events
            await db.execute(text("SELECT id FROM analytics_events LIMIT 1"))
            print("✅ Tabla 'analytics_events' EXISTE.")
        except Exception as e:
            print("❌ Tabla 'analytics_events' NO EXISTE o falló:", e)

if __name__ == "__main__":
    asyncio.run(check_tables())
