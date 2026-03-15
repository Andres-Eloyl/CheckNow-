"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrder } from '@/hooks/useOrder';
import Link from 'next/link';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { BottomNavigation } from '@/components/ui/BottomNavigation';

export default function CartPage() {
  const [activeTab, setActiveTab] = useState<'mine' | 'table'>('mine');
  const { cart, myCart, myTotal, tableTotal } = useOrder();

  const activeCart = activeTab === 'mine' ? myCart : cart;
  const currentTotal = activeTab === 'mine' ? myTotal : tableTotal;

  return (
    <div className="bg-slate-50 dark:bg-[#0A0A0B] font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased selection:bg-primary/30">
      
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-5">
        <div className="flex items-center justify-between mb-5">
          <Link href="/menu" className="w-10 h-10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </Link>
          <h1 className="text-[20px] font-black tracking-tight">Tu Orden</h1>
          <div className="w-10"></div>
        </div>

        <div className="bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl flex relative isolation-auto">
          {['mine', 'table'].map((tab) => {
             const isActive = activeTab === tab;
             const label = tab === 'mine' ? 'Mi Cuenta' : 'Toda la Mesa';
             return (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as 'mine' | 'table')}
                 className={`flex-1 relative z-10 py-2.5 text-[14px] font-bold tracking-wide transition-colors rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                   isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                 }`}
               >
                 {isActive && (
                   <motion.div 
                     layoutId="cartTabIndicator"
                     transition={{ type: "spring", stiffness: 450, damping: 30 }}
                     className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl shadow-sm border border-slate-200/50 dark:border-white/5 -z-10"
                   />
                 )}
                 {label}
               </button>
             );
          })}
        </div>
      </header>

      <main className="flex-1 p-5 pb-[180px] max-w-2xl mx-auto w-full">
        <AnimatePresence mode="popLayout">
          {activeCart.length > 0 ? (
            <motion.div layout className="min-h-[50vh]">
              {activeCart.map((item) => (
                <CartItemCard 
                  key={item.id} 
                  item={item} 
                  readOnly={activeTab === 'table' && item.userId !== '1'} 
                />
              ))}
            </motion.div>
          ) : (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center h-[50vh] text-center px-4"
            >
              <div className="size-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-slate-600">receipt_long</span>
              </div>
              <h2 className="text-xl font-bold mb-2">Orden vacía</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-[250px] mx-auto">
                Aún no has agregado nada a {activeTab === 'mine' ? 'tu cuenta' : 'la cuenta de la mesa'}.
              </p>
              <Link 
                href="/menu" 
                className="bg-primary hover:bg-primary/95 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-primary/30 transition-all active:scale-95"
              >
                Ver Menú
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Checkout Container */}
      <AnimatePresence>
        {activeCart.length > 0 && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-[88px] left-0 right-0 z-30 px-5 max-w-2xl mx-auto w-full"
          >
            <div className="bg-white/90 dark:bg-[#151516]/90 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-[28px] p-5 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.1)] mb-4">
              <div className="flex justify-between items-end mb-5">
                <div>
                  <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Confirmado</p>
                  <p className="text-[12px] font-semibold text-slate-400 line-through decoration-slate-300 dark:decoration-slate-700">Antes: ${(currentTotal * 1.05).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[32px] font-black text-slate-900 dark:text-white leading-none tracking-tighter">${currentTotal.toFixed(2)}</p>
                </div>
              </div>
              
              <Link 
                href="/split" 
                className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[16px] rounded-[16px] flex justify-center items-center gap-2 transition-all hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] shadow-md outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              >
                Dividir y Pagar
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNavigation />
    </div>
  );
}
