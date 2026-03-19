'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { MenuCategory, MenuItem } from '@/types/dashboard.types';
import { CategorySection } from '@/components/dashboard/CategorySection';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

const DEMO_CATEGORIES: MenuCategory[] = [
  { id: 'c1', name: 'Hamburguesas', icon: '🍔' },
  { id: 'c2', name: 'Bebidas', icon: '🥤' },
];

const DEMO_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Hamburguesa Clásica',
    description: 'Carne 100% Wagyu con lechuga fresca, tomates y nuestra salsa especial en pan brioche.',
    price_usd: 12.00,
    prep_time_minutes: 15,
    destination: 'kitchen',
    category_id: 'c1',
    stock_count: 50,
    is_available: true,
    modifiers: [{ name: 'Agregar Tocino', extra_price: 2.00 }, { name: 'Extra Queso', extra_price: 1.50 }],
  },
  {
    id: 'm2',
    name: 'Hamburguesa con Queso',
    description: 'Hamburguesa clásica con queso cheddar derretido, pepinillos y cebolla crujiente.',
    price_usd: 14.00,
    prep_time_minutes: 15,
    destination: 'kitchen',
    category_id: 'c1',
    stock_count: 35,
    is_available: true,
    modifiers: [{ name: 'Doble Carne', extra_price: 4.00 }],
  },
  {
    id: 'm3',
    name: 'Margarita',
    description: 'Margarita clásica de limón con tequila premium, servida con hielo y borde de sal.',
    price_usd: 9.00,
    prep_time_minutes: 5,
    destination: 'bar',
    category_id: 'c2',
    stock_count: 120,
    is_available: true,
    modifiers: [{ name: 'Tequila Premium', extra_price: 5.00 }],
  },
];

export default function MenuAdministrator() {
  const [categories] = useState<MenuCategory[]>(DEMO_CATEGORIES);
  const [items, setItems] = useState<MenuItem[]>(DEMO_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');

  const handleStockChange = useCallback(async (itemId: string, newStock: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, stock_count: newStock, is_available: newStock > 0 }
          : item
      )
    );

    try {
      await fetch(`/api/demo/menu/items/${itemId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_count: newStock }),
      });
    } catch {
      // Actualización local funciona para demo
    }
  }, []);

  const handleEditItem = (id: string) => alert(`Editar ítem: ${id}`);
  const handleDeleteItem = (id: string) => alert(`Eliminar ítem: ${id}`);
  const handleEditCategory = (id: string) => alert(`Editar categoría: ${id}`);
  const handleDeleteCategory = (id: string) => alert(`Eliminar categoría: ${id}`);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#120d0b] text-slate-100 font-display">
      {/* Navegación lateral */}
      <DashboardNav />

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Encabezado */}
        <header className="h-14 flex items-center justify-between px-6 bg-[#1a120d] border-b border-primary/15 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold">Administrador de Menú</h2>
            <div className="relative w-56">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base leading-none">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ítems..."
                className="w-full pl-9 pr-3 py-1.5 bg-primary/5 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary text-slate-100 placeholder:text-slate-600 outline-none"
              />
            </div>
          </div>
          <button className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all border border-primary/20">
            <span className="material-symbols-outlined text-[16px] leading-none">add</span>
            Agregar Ítem
          </button>
        </header>

        {/* Lista de categorías */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto flex flex-col gap-5">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight">Gestión del Menú</h1>
                <p className="text-slate-500 text-sm mt-0.5">Configura categorías, ítems y controla el inventario en vivo.</p>
              </div>
              <button className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 text-sm">
                <span className="material-symbols-outlined text-[18px] leading-none">publish</span>
                Publicar Cambios
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {categories.map(cat => (
                <CategorySection
                  key={cat.id}
                  category={cat}
                  items={filteredItems.filter(i => i.category_id === cat.id)}
                  onStockChange={handleStockChange}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
