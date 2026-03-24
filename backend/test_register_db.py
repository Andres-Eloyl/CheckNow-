import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.restaurant import Restaurant, RestaurantConfig
from app.models.subscription import SubscriptionPlan
# from app.core.security import hash_password

async def test_register_db():
    print("🔹 Testing registration logic...")
    async with async_session_factory() as db:
        try:
            password = "dummy_hash"
            
            restaurant = Restaurant(
                name="Test API",
                slug=f"api-{uuid.uuid4().hex[:6]}",
                email=f"api{uuid.uuid4().hex[:6]}@example.com",
                password_hash=password,
                phone="+584141234567",
                country="VE",
            )
            db.add(restaurant)
            await db.flush()
            print("✅ Restaurant flushed. ID:", restaurant.id)

            config = RestaurantConfig(restaurant_id=restaurant.id)
            db.add(config)
            await db.flush()
            print("✅ Config flushed.")

            free_plan = await db.execute(
                select(SubscriptionPlan).where(SubscriptionPlan.name == "Free")
            )
            free_plan_obj = free_plan.scalar_one_or_none()
            if free_plan_obj:
                restaurant.plan_id = free_plan_obj.id
                restaurant.trial_ends = datetime.now(timezone.utc) + timedelta(days=14)
                print("✅ Plan asignado.")
            else:
                print("⚠️ No hay Free plan.")

            await db.commit()
            print("✅ Registro Exitoso!")
        except Exception as e:
            import traceback
            print("💥 ERROR 500 SIMULADO:")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_register_db())
