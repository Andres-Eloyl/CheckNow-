import React, { useState, useEffect } from 'react';
import { MenuItem } from '@/types/dashboard.types';

/**
 * Props for the MenuItemRow component.
 */
interface MenuItemRowProps {
  item: MenuItem;
  /** Callback fired when the local stock input changes and loses focus. */
  onStockChange: (itemId: string, newStock: number) => void;
  onEdit: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

/**
 * AI Context: Represents a single editable item row within the Dashboard Menu view.
 * It manages local state for the stock input field, only triggering `onStockChange` 
 * on blur to avoid excessive re-renders or API calls on every keystroke.
 */
export function MenuItemRow({ item, onStockChange, onEdit, onDelete }: MenuItemRowProps) {
  const [stockLocal, setStockLocal] = useState(item.stock_count.toString());

  useEffect(() => {
    setStockLocal(item.stock_count.toString());
  }, [item.stock_count]);

  const handleStockBlur = () => {
    const num = parseInt(stockLocal, 10);
    if (!isNaN(num) && num !== item.stock_count && num >= 0) {
      onStockChange(item.id, num);
    } else {
      setStockLocal(item.stock_count.toString());
    }
  };

  return (
    <div className="p-5 grid grid-cols-12 gap-4 items-start hover:bg-primary/5 transition-colors">
      {/* Info del ítem */}
      <div className="col-span-4 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm ${!item.is_available ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
            {item.name}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.destination === 'bar' ? 'bg-blue-500/10 text-blue-400' : 'bg-primary/10 text-primary'}`}>
            {item.destination === 'bar' ? 'BAR' : 'COCINA'}
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
        {item.modifiers.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.modifiers.map((mod, idx) => (
              <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-primary/15 text-slate-400">
                {mod.name} (+${mod.extra_price.toFixed(2)})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Precio */}
      <div className="col-span-2 flex flex-col gap-0.5">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Precio</span>
        <span className="text-base font-bold text-primary">${item.price_usd.toFixed(2)}</span>
      </div>

      {/* Tiempo */}
      <div className="col-span-2 flex flex-col gap-0.5">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Preparación</span>
        <div className="flex items-center gap-1 text-slate-300">
          <span className="material-symbols-outlined text-[16px] leading-none">schedule</span>
          <span className="font-medium text-sm">{item.prep_time_minutes} min</span>
        </div>
      </div>

      {/* Stock */}
      <div className="col-span-2 flex flex-col gap-0.5">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Stock</span>
        <div className={`overflow-hidden rounded-lg border-2 ${!item.is_available ? 'border-red-500' : 'border-primary'}`}>
          <input
            type="number"
            min="0"
            value={stockLocal}
            onChange={(e) => setStockLocal(e.target.value)}
            onBlur={handleStockBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className={`w-full text-center py-1 border-none focus:ring-0 font-bold text-sm bg-[#1a120d] ${!item.is_available ? 'text-red-500' : 'text-primary'}`}
          />
        </div>
        {!item.is_available && <span className="text-[9px] text-red-500 font-bold uppercase">Agotado</span>}
      </div>

      {/* Acciones */}
      <div className="col-span-2 flex justify-end items-center gap-1 pt-3">
        <button onClick={() => onEdit(item.id)} className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Editar">
          <span className="material-symbols-outlined text-[18px] leading-none">edit</span>
        </button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar">
          <span className="material-symbols-outlined text-[18px] leading-none">delete</span>
        </button>
      </div>
    </div>
  );
}
