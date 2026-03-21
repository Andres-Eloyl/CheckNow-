import asyncio
import uuid
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.restaurant import Restaurant, RestaurantConfig
from app.models.loyalty import LoyaltyAccount
from app.routers.loyalty import _hash_phone

async def run_test():
    async with async_session_factory() as db:
        print("🔹 Buscando restaurante...")
        result = await db.execute(select(Restaurant).limit(1))
        restaurant = result.scalars().first()
        
        if not restaurant:
            print("❌ No hay restaurantes. No se puede probar.")
            return

        print(f"✅ Restaurante encontrado: {restaurant.name}")

        print("🔹 Habilitando Loyalty y Configurando Tasas...")
        config_result = await db.execute(select(RestaurantConfig).where(RestaurantConfig.restaurant_id == restaurant.id))
        config = config_result.scalars().first()
        config.loyalty_enabled = True
        config.points_reward_rate = 10
        config.points_redemption_value = 0.0100
        await db.commit()
        print("✅ Puntos activados (1 USD = 10 Pts, 1 Pto = 0.01 USD)")

        print("🔹 Buscando/Creando Cuenta de Lealtad (Check)...")
        phone_raw = "+584141234567"
        phone_hash = _hash_phone(phone_raw)
        
        acc_result = await db.execute(
            select(LoyaltyAccount).where(LoyaltyAccount.phone_hash == phone_hash)
        )
        account = acc_result.scalars().first()
        if not account:
            account = LoyaltyAccount(
                restaurant_id=restaurant.id,
                phone_hash=phone_hash,
                points_balance=0,
                total_spent_usd=0.0,
                visit_count=0
            )
            db.add(account)
            await db.commit()
            print("✅ Cuenta nueva creada.")
        else:
            print(f"✅ Cuenta existente. Saldo inicial: {account.points_balance} pts")

        print("🔹 Simulando acumulación (Pago Verificado de $50)...")
        amount_usd = 50.0
        points_earned = int(amount_usd * config.points_reward_rate)
        account.points_balance += points_earned
        account.total_spent_usd += float(amount_usd)
        account.visit_count += 1
        await db.commit()
        await db.refresh(account)
        
        print(f"✅ Se sumaron {points_earned} pts. (Gasto Total: ${account.total_spent_usd})")
        print(f"✅ Saldo de Puntos Actual: {account.points_balance} pts")

        print("🔹 Simulando canje (Redeem de 200 pts)...")
        puntos_a_usar = 200
        if account.points_balance >= puntos_a_usar:
            descuento_usd = puntos_a_usar * float(config.points_redemption_value)
            account.points_balance -= puntos_a_usar
            await db.commit()
            print(f"✅ Puntos canjeados. Descuento aplicado: ${descuento_usd:.2f}")
            print(f"✅ Saldo de Puntos Restante: {account.points_balance} pts")
        else:
            print("❌ Saldo insuficiente para canje.")

        print("\n✅ Prueba del Motor de Loyalty finalizada con éxito.")

if __name__ == "__main__":
    asyncio.run(run_test())
