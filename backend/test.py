import asyncio
from app.core.database import async_session_factory
from app.routers.auth import register_restaurant
from app.schemas.auth import RestaurantRegister
from fastapi import HTTPException

async def test_register():
    data = RestaurantRegister(
        name="Test Rest",
        slug="test-rest-123",
        email="test1234@example.com",
        password="password123",
        phone="+1234567890",
        country="VE"
    )
    async with async_session_factory() as db:
        try:
            res = await register_restaurant(data=data, db=db)
            print("Success:", res)
        except HTTPException as e:
            print("HTTPException:", e.detail)
        except Exception as e:
            print("Exception:", e)
            import traceback
            with open("test_out2.txt", "w", encoding="utf-8") as f:
                traceback.print_exc(file=f)

if __name__ == "__main__":
    asyncio.run(test_register())
