"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, MOCK_MENU } from '@/lib/mocks/data';
import { MenuItem } from '@/types';
import Link from 'next/link';
import { useOrder } from '@/hooks/useOrder';

import { MenuHeader } from '@/components/menu/MenuHeader';
import { CategoriesTabBar } from '@/components/menu/CategoriesTabBar';
import { MenuCard } from '@/components/menu/MenuCard';
import { ItemDetailsSheet } from '@/components/menu/ItemDetailsSheet';
import { BottomNavigation } from '@/components/ui/BottomNavigation';

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { globalCartCount } = useOrder();

  const popularEntrances = MOCK_MENU.filter(m => m.tag === 'Entradas Populares');
  const chefSuggestions = MOCK_MENU.filter(m => m.tag === 'Sugerencias del Chef');

  // Staggered list variants
  const containerVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, ease: "easeOut" }
    }
  };

  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { type: 'spring', stiffness: 400, damping: 30 } 
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#0A0A0B] font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased selection:bg-primary/30">
      
      <div className="sticky top-0 z-50 flex flex-col w-full">
        <MenuHeader />
        <CategoriesTabBar 
          activeCategory={activeCategory} 
          setActiveCategory={setActiveCategory} 
        />
      </div>

      <main className="flex-1 p-5 pb-[140px] max-w-2xl mx-auto w-full">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {/* Section: Entradas Populares */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4 pt-2">
            <div className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[20px] block">local_fire_department</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Entradas Populares</h3>
          </motion.div>
          
          <div className="grid gap-4">
            {popularEntrances.map(item => (
               <MenuCard key={item.id} item={item} onOpen={setSelectedItem} variants={itemVariants} />
            ))}
          </div>

          {/* Section: Sugerencias del Chef */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4 pt-8">
            <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[20px] block">star</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Sugerencias del Chef</h3>
          </motion.div>
          
          <div className="grid gap-4">
            {chefSuggestions.map(item => (
              <MenuCard key={item.id} item={item} onOpen={setSelectedItem} variants={itemVariants} />
            ))}
          </div>
        </motion.div>
      </main>

      {/* Floating Action Button (Cart) */}
      <Link 
        href="/cart" 
        aria-label={`Ver carrito con ${globalCartCount} elementos`}
        className="fixed bottom-28 right-5 z-40 size-16 rounded-[20px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-2xl active:scale-90 hover:scale-[1.03] transition-all duration-300 ease-out outline-none focus-visible:ring-4 focus-visible:ring-slate-900/30 group"
      >
        <span className="material-symbols-outlined text-[28px] group-hover:-translate-y-0.5 transition-transform duration-300">shopping_cart</span>
        <AnimatePresence>
          {globalCartCount > 0 && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-primary text-white text-[12px] font-black min-w-[26px] h-[26px] px-1.5 rounded-full flex items-center justify-center border-4 border-slate-50 dark:border-[#0A0A0B] shadow-sm transform group-hover:scale-110 transition-transform"
            >
              {globalCartCount}
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      <BottomNavigation />

      <ItemDetailsSheet item={selectedItem} onClose={() => setSelectedItem(null)} />

      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(200%) skew(-15deg);
          }
        }
      `}</style>
    </div>
  );
}
