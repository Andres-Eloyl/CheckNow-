import React, { useState } from 'react';
import { MenuCategory, MenuItem } from '@/types/dashboard.types';
import { MenuItemRow } from './MenuItemRow';

/**
 * Props for CategorySection
 */
interface CategorySectionProps {
  category: MenuCategory;
  items: MenuItem[];
  onStockChange: (itemId: string, newStock: number) => void;
  onEditItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onEditCategory: (categoryId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

/**
 * AI Context: A collapsible accordion section for the Dashboard Menu view.
 * Groups `MenuItemRow` instances by category.
 */
export function CategorySection({ category, items, onStockChange, onEditItem, onDeleteItem, onEditCategory, onDeleteCategory }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-[#1a120d] rounded-xl border border-primary/15 overflow-hidden">
      {/* Encabezado de categoría */}
      <div className="flex items-center justify-between px-5 py-3 bg-primary/5 border-b border-primary/10 group">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-primary transition-colors"
            style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
          >
            <span className="material-symbols-outlined text-[20px] leading-none">expand_more</span>
          </button>
          <h3 className="text-base font-bold flex items-center gap-2">
            {category.name} <span className="text-lg">{category.icon}</span>
          </h3>
          <span className="px-2 py-0.5 bg-primary/15 text-primary rounded text-[10px] font-bold uppercase">
            {items.length} {items.length === 1 ? 'Ítem' : 'Ítems'}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEditCategory(category.id)} className="p-1 text-slate-500 hover:text-primary rounded transition-colors" title="Editar categoría">
            <span className="material-symbols-outlined text-[16px] leading-none">edit</span>
          </button>
          <button onClick={() => onDeleteCategory(category.id)} className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors" title="Eliminar categoría">
            <span className="material-symbols-outlined text-[16px] leading-none">delete</span>
          </button>
        </div>
      </div>

      {/* Lista de ítems */}
      {isExpanded && (
        <div className="divide-y divide-primary/10">
          {items.map(item => (
            <MenuItemRow
              key={item.id}
              item={item}
              onStockChange={onStockChange}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))}
          {items.length === 0 && (
            <div className="p-6 text-center text-slate-600 text-sm">Sin ítems en esta categoría.</div>
          )}
        </div>
      )}
    </div>
  );
}
