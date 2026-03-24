import asyncio
import uuid
from sqlalchemy import select
from app.core.database import async_session_factory
from app.routers.auth import register_restaurant
from app.schemas.auth import RestaurantRegister
from fastapi import HTTPException

async def test_register():
    data = RestaurantRegister(
        name="Test 500",
        slug=f"test-{uuid.uuid4().hex[:6]}",
        email=f"test{uuid.uuid4().hex[:6]}@example.com",
        password="password123",
        phone="+12345678"
    )

    async with async_session_factory() as db:
        try:
            print(f"🔹 Intentando registrar: {data.slug}")
            response = await register_restaurant(data=data, db=db)
            print(f"✅ ¡Éxito! Token: {response.access_token[:20]}...")
        except HTTPException as e:
            print(f"❌ Error HTTP {e.status_code}: {e.detail}")
        except Exception as e:
            import traceback
            print(f"💥 ¡Error 500 Capturado!")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_register())
