"use client";

import { motion } from 'framer-motion';
import type { OrderItemResponse } from '@/types/api.types';
import { useOrder } from '@/hooks/useOrder';
import { useState } from 'react';

interface CartItemCardProps {
  item: OrderItemResponse;
  readOnly?: boolean;
}

export function CartItemCard({ item, readOnly = false }: CartItemCardProps) {
  const { removeOrderItem } = useOrder();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (item.status !== 'pending') return; // Only remove pending items
    setIsRemoving(true);
    try {
      await removeOrderItem(item.id);
    } catch {
      setIsRemoving(false);
    }
  };

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' },
    sent: { text: 'Enviado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    preparing: { text: 'Preparando', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
    ready: { text: 'Listo', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
    delivered: { text: 'Entregado', color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
    cancelled: { text: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  };

  const currentStatus = statusLabel[item.status] || statusLabel.pending;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isRemoving ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      className="bg-white dark:bg-[#151516] p-4 rounded-[24px] mb-4 border border-slate-200/60 dark:border-white/5 shadow-sm shadow-slate-200/20 flex gap-4 w-full overflow-hidden relative group"
    >
      <div className="flex-1 min-w-0 pr-1 py-0.5">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h4 className="font-bold text-[16px] text-slate-900 dark:text-white leading-tight truncate">
            {item.menu_item_name || 'Item'}
          </h4>
          <span className="font-black text-primary text-[15px] shrink-0">
            ${(item.unit_price * item.quantity).toFixed(2)}
          </span>
        </div>

        {item.session_user_alias && (
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">
            por {item.session_user_alias}
          </p>
        )}
        
        {item.modifiers.length > 0 && (
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 leading-snug truncate">
            {item.modifiers.join(', ')}
          </p>
        )}

        {item.notes && (
          <p className="text-[11px] italic text-slate-400 dark:text-slate-500 mb-1.5 truncate">
            📝 {item.notes}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${currentStatus.color}`}>
            {currentStatus.text}
          </span>
          <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-neutral-800 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">
            ×{item.quantity}
          </span>
        </div>
      </div>

      {!readOnly && item.status === 'pending' && (
        <button
           type="button"
           onClick={handleRemove}
           disabled={isRemoving}
           className="absolute top-3 right-3 p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:text-rose-500 disabled:opacity-30"
           aria-label="Remover ítem"
        >
           <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </motion.div>
  );
}
