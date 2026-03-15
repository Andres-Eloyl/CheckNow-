"use client";

import { motion } from 'framer-motion';
import { OrderItem } from '@/types';
import { useOrder } from '@/hooks/useOrder';

interface CartItemCardProps {
  item: OrderItem;
  readOnly?: boolean;
}

export function CartItemCard({ item, readOnly = false }: CartItemCardProps) {
  const { updateQuantity, removeItem } = useOrder();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      className="bg-white dark:bg-[#151516] p-4 rounded-[24px] mb-4 border border-slate-200/60 dark:border-white/5 shadow-sm shadow-slate-200/20 flex gap-4 w-full overflow-hidden relative group"
    >
      <div className="size-20 lg:size-24 rounded-[16px] overflow-hidden shrink-0 bg-slate-100 dark:bg-neutral-800 shadow-sm relative border border-slate-100 dark:border-white/5">
        <img src={item.menuItem.image} alt={item.menuItem.name} className="w-full h-full object-cover" />
      </div>
      
      <div className="flex-1 min-w-0 pr-1 py-0.5">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h4 className="font-bold text-[16px] text-slate-900 dark:text-white leading-tight truncate">{item.menuItem.name}</h4>
          <span className="font-black text-primary text-[15px] shrink-0">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
        </div>
        
        {item.modifiers.length > 0 && (
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-2.5 leading-snug truncate">
            {item.modifiers.join(', ')}
          </p>
        )}
        
        {!readOnly ? (
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-neutral-800/80 rounded-full p-1 border border-slate-200/50 dark:border-white/5">
              <button 
                type="button"
                onClick={() => {
                  if (item.quantity > 1) updateQuantity(item.id, -1);
                  else removeItem(item.id);
                }}
                className={`size-7 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                  item.quantity === 1 
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' 
                  : 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm'
                }`}
                aria-label={item.quantity === 1 ? "Eliminar del carrito" : "Disminuir cantidad"}
              >
                <span className="material-symbols-outlined text-[16px] font-bold">
                  {item.quantity === 1 ? 'delete' : 'remove'}
                </span>
              </button>
              
              <span className="font-bold text-[14px] w-4 text-center text-slate-900 dark:text-white">{item.quantity}</span>
              
              <button 
                type="button"
                onClick={() => updateQuantity(item.id, 1)}
                className="size-7 rounded-full bg-white dark:bg-neutral-700 shadow-sm flex items-center justify-center text-slate-900 dark:text-white transition-colors active:scale-90"
                aria-label="Aumentar cantidad"
              >
                <span className="material-symbols-outlined text-[16px] font-bold">add</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
             <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-neutral-800 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">
               Cant: {item.quantity}
             </span>
          </div>
        )}
      </div>

      {!readOnly && (
        <button
           type="button"
           onClick={() => removeItem(item.id)}
           className="absolute top-2 right-2 p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:text-rose-500"
           aria-label="Remover ítem completo"
        >
           <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </motion.div>
  );
}
