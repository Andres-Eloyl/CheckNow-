import asyncio
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_factory
from app.models.restaurant import Restaurant, RestaurantConfig
from app.models.menu import MenuCategory, MenuItem
from app.models.cross_sell import CrossSellRule

async def run_test():
    async with async_session_factory() as db:
        # 1. Obtenemos un restaurante de la BD
        print("🔹 Buscando restaurante...")
        result = await db.execute(select(Restaurant).limit(1))
        restaurant = result.scalars().first()
        
        if not restaurant:
            print("❌ No hay restaurantes en Supabase. No se puede probar.")
            return

        print(f"✅ Restaurante encontrado: {restaurant.name} (Slug: {restaurant.slug})")

        # 2. Habilitar Cross-Selling
        print("🔹 Habilitando Cross-Selling...")
        config_result = await db.execute(select(RestaurantConfig).where(RestaurantConfig.restaurant_id == restaurant.id))
        config = config_result.scalars().first()
        if not config:
            config = RestaurantConfig(restaurant_id=restaurant.id, cross_sell_enabled=True)
            db.add(config)
        else:
            config.cross_sell_enabled = True
        await db.commit()
        print("✅ Cross-Selling habilitado.")

        # 3. Crear Categoría e Items si no existen
        print("🔹 Buscando/Creando Items del Menú...")
        cat_result = await db.execute(select(MenuCategory).where(MenuCategory.restaurant_id == restaurant.id))
        category = cat_result.scalars().first()
        if not category:
            category = MenuCategory(restaurant_id=restaurant.id, name="Test Category")
            db.add(category)
            await db.commit()
            await db.refresh(category)

        # Crear dos items: Principal y Sugerido
        items_result = await db.execute(select(MenuItem).where(MenuItem.category_id == category.id))
        items = items_result.scalars().all()
        
        if len(items) < 2:
            item_a = MenuItem(category_id=category.id, name="Hamburguesa Clásica", price_usd=10.00, is_available=True)
            item_b = MenuItem(category_id=category.id, name="Papas Fritas Grandes", price_usd=3.00, is_available=True)
            db.add_all([item_a, item_b])
            await db.commit()
            await db.refresh(item_a)
            await db.refresh(item_b)
        else:
            item_a = items[0]
            item_b = items[1]
        
        print(f"✅ Items listos: Trigger='{item_a.name}', Sugerido='{item_b.name}'")

        # 4. Crear Regla de Cross-Sell
        print("🔹 Creando Regla de Cross-Sell...")
        # Limpiar reglas previas
        await db.execute(CrossSellRule.__table__.delete())
        
        rule = CrossSellRule(
            restaurant_id=restaurant.id,
            trigger_item_id=item_a.id,
            suggested_item_id=item_b.id,
            priority=10,
            message="¡Hazlo en combo con estas Papas!",
            discount_pct=0.10, # 10% descuento
            is_active=True
        )
        db.add(rule)
        await db.commit()
        print(f"✅ Regla creada: '{item_a.name}' -> '{item_b.name}' con 10% descuento.")

        # 5. Probar lógica de sugerencia (Semejante al Endpoint Público)
        print("🔹 Simulando petición al endpoint de sugerencias...")
        rules_result = await db.execute(
            select(CrossSellRule, MenuItem)
            .join(MenuItem, CrossSellRule.suggested_item_id == MenuItem.id)
            .where(
                CrossSellRule.restaurant_id == restaurant.id,
                CrossSellRule.trigger_item_id == item_a.id,
                CrossSellRule.is_active == True,
                MenuItem.is_available == True
            )
            .order_by(CrossSellRule.priority.desc())
        )
        suggestions = rules_result.all()

        print("\n--- RESULTADOS SUGERENCIAS ---")
        if not suggestions:
            print("❌ No se encontraron sugerencias.")
        else:
            for r, item in suggestions:
                precio_original = float(item.price_usd)
                precio_descuento = round(precio_original * (1 - r.discount_pct), 2)
                print(f"🛒 Agregaste: {item_a.name}")
                print(f"✨ SUGERENCIA: {r.message}")
                print(f"👉 Item: {item.name}")
                print(f"💰 Precio Original: ${precio_original:.2f}")
                print(f"🔥 Llévalo por: ${precio_descuento:.2f} (10% OFF)")
                print("------------------------------")
                
        print("\n✅ Prueba de Cross-Selling finalizada con éxito.")

if __name__ == "__main__":
    asyncio.run(run_test())
