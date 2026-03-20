"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuItemResponse } from '@/types/api.types';
import { useSessionStore } from '@/stores/session.store';
import { orderService } from '@/lib/api/order.service';
import { useToast } from '@/components/ui/Toast';

interface ItemDetailsSheetProps {
  item: MenuItemResponse | null;
  onClose: () => void;
}

export function ItemDetailsSheet({ item, onClose }: ItemDetailsSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const { slug, sessionToken, addOrder } = useSessionStore();
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSelectedModifiers([]);
      setNotes('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [item]);

  if (!item) return null;

  const toggleModifier = (mod: string) => {
    setSelectedModifiers(prev => 
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  const handleAddToCart = async () => {
    if (!slug || !sessionToken) {
      toast('Sesión no válida', 'error');
      return;
    }
    setIsAdding(true);
    try {
      const newOrder = await orderService.addItem(slug, sessionToken, {
        menu_item_id: item.id,
        quantity,
        modifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined,
        notes: notes.trim() || undefined,
      });
      addOrder(newOrder);
      toast('Agregado a la orden', 'success');
      onClose();
    } catch {
      toast('Error al agregar orden', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const placeholderImage = 'https://placehold.co/800x600/1a1a1b/666?text=🍽️';

  // Compute total with modifier extra prices
  const modifierExtras = item.modifiers
    .filter(m => selectedModifiers.includes(m.name))
    .reduce((sum, m) => sum + m.extra_price, 0);
  const totalPrice = (item.price_usd + modifierExtras) * quantity;

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div 
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-50 transition-opacity"
            aria-hidden="true"
          />
          <motion.div
            key="sheet"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={(e, info) => {
              if (info.offset.y > 80 || info.velocity.y > 500) onClose();
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { type: "tween", duration: 0.25, ease: "easeIn" } }}
            transition={{ type: 'spring', damping: 28, stiffness: 220, mass: 0.8 }}
            className="fixed bottom-0 inset-x-0 h-[92vh] max-h-[850px] bg-white dark:bg-[#0A0A0B] rounded-t-[36px] z-[60] overflow-hidden flex flex-col shadow-2xl pointer-events-auto max-w-2xl mx-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="absolute top-3 inset-x-0 flex justify-center z-20 cursor-grab active:cursor-grabbing pb-8">
              <div className="w-14 h-1.5 bg-white/70 backdrop-blur-md rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.1)]" />
            </div>

            <div className="relative h-[35%] shrink-0 bg-slate-100 dark:bg-neutral-900 border-b border-slate-100 dark:border-white/5">
              <img src={item.image_url || placeholderImage} className="w-full h-full object-cover" alt="" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white dark:from-[#0A0A0B] to-transparent pointer-events-none"></div>
              <button 
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-lg rounded-full flex items-center justify-center text-white transition-all active:scale-90"
                aria-label="Cerrar detalles"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 pb-32 overscroll-contain">
              <div className="flex justify-between items-start gap-4">
                <h2 id="modal-title" className="text-[26px] lg:text-[32px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">{item.name}</h2>
                <span className="text-[26px] font-black text-primary shrink-0 -mt-1 tracking-tight">${item.price_usd.toFixed(2)}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-[15px] lg:text-[17px] leading-relaxed max-w-prose">{item.description || ''}</p>
              
              {/* Modifiers from API */}
              {item.modifiers.length > 0 && (
                <div className="mt-8 border-t border-slate-100 dark:border-white/5 pt-6">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-bold text-[18px] text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-slate-400">tune</span>
                      ¿Alguna preferencia?
                    </h3>
                    <span className="bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Opcional</span>
                  </div>
                  
                  <div className="flex flex-col gap-3.5">
                    {item.modifiers.filter(m => m.is_active).map(mod => {
                      const isChecked = selectedModifiers.includes(mod.name);
                      return (
                        <label key={mod.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.98] ${
                          isChecked 
                          ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-[0_4px_12px_-4px_rgba(244,123,37,0.2)]' 
                          : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
                        }`}>
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={isChecked}
                            onChange={() => toggleModifier(mod.name)}
                            aria-label={`Seleccionar ${mod.name}`}
                          />
                          <div className={`w-6 h-6 rounded-full flex flex-shrink-0 items-center justify-center transition-all ${
                            isChecked ? 'bg-primary scale-110' : 'bg-slate-200 dark:bg-neutral-700'
                          }`}>
                            {isChecked && (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="material-symbols-outlined text-white text-[14px] font-bold"
                              >
                                check
                              </motion.span>
                            )}
                          </div>
                          <span className={`font-semibold text-[15px] transition-colors flex-1 ${
                            isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                          }`}>
                            {mod.name}
                            {mod.extra_price > 0 && (
                              <span className="text-primary ml-1">(+${mod.extra_price.toFixed(2)})</span>
                            )}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Notes field */}
              <div className="mt-6">
                <label className="font-bold text-[15px] text-slate-900 dark:text-white mb-2 block">
                  Notas especiales
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Término medio, sin picante..."
                  maxLength={200}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-[14px] placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="mt-8 flex items-center justify-between">
                <h3 className="font-bold text-[18px] text-slate-900 dark:text-white">Cantidad</h3>
                <div className="flex items-center gap-5 bg-slate-100 dark:bg-white/5 rounded-full p-1.5 border border-slate-200/60 dark:border-white/5 shadow-inner">
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="size-[42px] rounded-full bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700 flex items-center justify-center text-slate-900 dark:text-white transition-colors active:scale-90 disabled:opacity-40 disabled:active:scale-100 shadow-sm"
                    disabled={quantity <= 1}
                    aria-label="Disminuir cantidad"
                  >
                    <span className="material-symbols-outlined text-[20px]">remove</span>
                  </button>
                  <AnimatePresence mode="popLayout">
                    <motion.span 
                      key={quantity}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="font-black text-[22px] w-6 text-center text-slate-900 dark:text-white"
                    >
                      {quantity}
                    </motion.span>
                  </AnimatePresence>
                  <button 
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="size-[42px] rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-white transition-colors active:scale-90 shadow-md shadow-primary/30"
                    aria-label="Aumentar cantidad"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] bg-white/95 dark:bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/10 shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.08)]">
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={isAdding}
                className="w-full h-16 bg-primary text-white font-bold text-[18px] rounded-[20px] shadow-[0_8px_32px_rgb(244,123,37,0.35)] flex justify-between px-6 items-center transition-all outline-none focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0A0A0B] overflow-hidden relative group disabled:opacity-70"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] skew-x-[-15deg] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] mb-0.5" style={{fontVariationSettings: "'FILL' 1"}}>shopping_bag</span>
                  {isAdding ? 'Agregando...' : 'Agregar Orden'}
                </span>
                <div className="bg-black/20 dark:bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 font-black">
                  ${totalPrice.toFixed(2)}
                </div>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
