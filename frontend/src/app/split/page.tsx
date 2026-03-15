"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useOrder } from '@/hooks/useOrder';
import { DivisionMethods, SplitMethod } from '@/components/split/DivisionMethods';

export default function SplitPage() {
  const router = useRouter();
  const { tableTotal } = useOrder();
  
  const [selectedMethod, setSelectedMethod] = useState<SplitMethod>(null);
  const [finalToPay, setFinalToPay] = useState<number>(0);

  const handleConfirm = () => {
    // We could store the split preference in OrderContext if needed,
    // but for now we just push to checkout page. The checkout page
    // needs the total. Usually we would persist this choice.
    router.push('/checkout'); // We will assume the checkout page knows the total or we could pass via query params
  };

  return (
    <div className="bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-100 min-h-screen font-display flex flex-col antialiased">
      
      {/* Top App Bar */}
      <header className="flex items-center p-4 pt-[calc(env(safe-area-inset-top)+1rem)] justify-between sticky top-0 bg-slate-50/80 dark:bg-[#0A0A0B]/80 backdrop-blur-md z-10 border-b border-slate-200/60 dark:border-white/5">
        <button onClick={() => router.back()} className="text-slate-900 dark:text-white flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
          ¿Cómo quieres pagar?
        </h2>
      </header>

      <main className="flex-1 px-5 pb-[140px] max-w-2xl mx-auto w-full">
        {/* Total Amount Section */}
        <section className="py-10 flex flex-col items-center">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2 font-mono">Total de la cuenta</p>
          <h1 className="text-slate-900 dark:text-white tracking-tight text-6xl font-black leading-tight text-center">
            ${tableTotal.toFixed(2)}
          </h1>
          <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full border border-primary/20">
            <span className="material-symbols-outlined text-primary text-[16px]">restaurant</span>
            <span className="text-primary text-[13px] font-bold">La Trattoria del Porto</span>
          </div>
        </section>

        {/* Extracted Division Methods */}
        <DivisionMethods 
           onMethodChange={(method, total) => {
             setSelectedMethod(method);
             setFinalToPay(total);
           }}
        />
      </main>

      {/* Fixed Bottom Action */}
      <AnimatePresence>
        {selectedMethod && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white dark:from-[#0A0A0B] via-white/95 dark:via-[#0A0A0B]/95 to-transparent z-50 pointer-events-none pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
          >
            <div className="max-w-2xl mx-auto">
              <button 
                onClick={handleConfirm}
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold text-[18px] h-16 rounded-[20px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_8px_32px_rgb(244,123,37,0.35)] pointer-events-auto"
              >
                <span>Confirmar ${finalToPay.toFixed(2)}</span>
                <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
