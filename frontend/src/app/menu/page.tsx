"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMenu } from '@/hooks/useMenu';
import { useSession } from '@/context/SessionContext';
import type { MenuItemResponse } from '@/types/api.types';
import Link from 'next/link';
import { useOrder } from '@/hooks/useOrder';

import { MenuHeader } from '@/components/menu/MenuHeader';
import { CategoriesTabBar } from '@/components/menu/CategoriesTabBar';
import { MenuCard } from '@/components/menu/MenuCard';
import { ItemDetailsSheet } from '@/components/menu/ItemDetailsSheet';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/**
 * Main interactive menu page.
 * Fetches categories and items from the API via useMenu hook.
 */
export default function MenuPage() {
  const { slug } = useSession();
  const { categories, loading, error, refetch } = useMenu(slug);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItemResponse | null>(null);
  const { globalCartCount } = useOrder();

  // Set first category as active when data loads
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Get items for the active category
  const activeCategoryData = categories.find(c => c.id === activeCategory);
  const activeCategoryItems = activeCategoryData?.items.filter(i => i.is_available) || [];

  // Featured items across all categories
  const featuredItems = categories.flatMap(c => c.items.filter(i => i.is_featured && i.is_available));

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
          categories={categories}
          activeCategory={activeCategory} 
          setActiveCategory={setActiveCategory} 
        />
      </div>

      <main className="flex-1 p-5 pb-[140px] max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
            <div className="size-20 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[36px] text-rose-500">wifi_off</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Error al cargar el menú</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-[280px]">{error}</p>
            <button 
              onClick={refetch}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-primary/30 transition-all active:scale-95"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Featured items section */}
            {featuredItems.length > 0 && (
              <>
                <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4 pt-2">
                  <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-[20px] block">star</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Destacados</h3>
                </motion.div>
                <div className="grid gap-4">
                  {featuredItems.map(item => (
                    <MenuCard key={item.id} item={item} onOpen={setSelectedItem} variants={itemVariants} />
                  ))}
                </div>
              </>
            )}

            {/* Active category items */}
            {activeCategoryData && activeCategoryItems.length > 0 && (
              <>
                <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4 pt-6">
                  <div className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-[20px] block">restaurant_menu</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeCategoryData.icon ? `${activeCategoryData.icon} ` : ''}{activeCategoryData.name}
                  </h3>
                </motion.div>
                <div className="grid gap-4">
                  {activeCategoryItems.map(item => (
                    <MenuCard key={item.id} item={item} onOpen={setSelectedItem} variants={itemVariants} />
                  ))}
                </div>
              </>
            )}

            {/* Empty state */}
            {activeCategoryItems.length === 0 && featuredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600 mb-4">menu_book</span>
                <p className="text-slate-500 dark:text-slate-400">No hay ítems disponibles en esta categoría</p>
              </div>
            )}
          </motion.div>
        )}
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
