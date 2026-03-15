"use client";

import { motion, AnimatePresence } from 'framer-motion';

export type PaymentMethod = 'transfer' | 'terminal' | null;

interface PaymentMethodsAccordionProps {
  expandedPayment: PaymentMethod;
  setExpandedPayment: (method: PaymentMethod) => void;
  refNumber: string;
  setRefNumber: (ref: string) => void;
  onTerminalRequest: () => void;
}

export function PaymentMethodsAccordion({
  expandedPayment,
  setExpandedPayment,
  refNumber,
  setRefNumber,
  onTerminalRequest
}: PaymentMethodsAccordionProps) {
  return (
    <section className="px-5 space-y-3">
      {/* Transferencia */}
      <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <button 
          onClick={() => setExpandedPayment(expandedPayment === 'transfer' ? null : 'transfer')}
          className="w-full flex cursor-pointer items-center justify-between px-4 py-4 list-none outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${expandedPayment === 'transfer' ? 'bg-primary/10' : 'bg-slate-100 dark:bg-neutral-800'}`}>
              <span className={`material-symbols-outlined ${expandedPayment === 'transfer' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>account_balance_wallet</span>
            </div>
            <p className="text-slate-900 dark:text-white text-[15px] font-bold tracking-tight">Transferencia / SPEI</p>
          </div>
          <motion.span 
            animate={{ rotate: expandedPayment === 'transfer' ? 180 : 0 }}
            className="material-symbols-outlined text-slate-400"
          >
            expand_more
          </motion.span>
        </button>
        
        <AnimatePresence>
          {expandedPayment === 'transfer' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-6 pt-2">
                <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                  <div className="flex items-center gap-2 mb-1 p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                    <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400">bolt</span>
                    <p className="text-amber-600 dark:text-amber-400 text-[12px] font-bold uppercase tracking-wider">Opción Rápida</p>
                  </div>
                  <label className="flex flex-col gap-2 relative">
                    <span className="text-slate-600 dark:text-slate-400 text-[14px] font-medium">Ingresa el # de Referencia de tu pago</span>
                    <div className="relative group">
                      <input 
                        value={refNumber}
                        onChange={(e) => setRefNumber(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0A0A0B] border-2 border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-mono tracking-widest outline-none pr-12 shadow-inner dark:shadow-none" 
                        placeholder="Ej: 123456789" 
                        type="text"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-primary">
                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">numbers</span>
                      </div>
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 px-1">Verifica el comprobante emitido por tu banco para encontrar el número.</p>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tarjeta / Terminal */}
      <div className="rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <button 
          onClick={() => setExpandedPayment(expandedPayment === 'terminal' ? null : 'terminal')}
          className="w-full flex cursor-pointer items-center justify-between px-4 py-4 list-none outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${expandedPayment === 'terminal' ? 'bg-primary/10' : 'bg-slate-100 dark:bg-neutral-800'}`}>
              <span className={`material-symbols-outlined ${expandedPayment === 'terminal' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>credit_card</span>
            </div>
            <p className="text-slate-900 dark:text-white text-[15px] font-bold tracking-tight">Terminal Física</p>
          </div>
          <motion.span 
            animate={{ rotate: expandedPayment === 'terminal' ? 180 : 0 }}
            className="material-symbols-outlined text-slate-400"
          >
            expand_more
          </motion.span>
        </button>

        <AnimatePresence>
          {expandedPayment === 'terminal' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-6 pt-2">
                <div className="border-t border-slate-100 dark:border-white/5 pt-4 text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-[14px] mb-4">El mesero se acercará con la terminal física a tu mesa.</p>
                  <button 
                    onClick={onTerminalRequest}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-slate-900/30"
                  >
                    Llamar mesero a la mesa
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
