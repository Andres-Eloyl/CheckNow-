'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSessionStore } from '@/stores/session.store';
import { useMenuStore } from '@/stores/menu.store';
import { menuService } from '@/lib/api/menu.service';
import { orderService } from '@/lib/api/order.service';
import { crossSellService } from '@/lib/api/crosssell.service';
import type { MenuItemResponse, MenuCategoryFull } from '@/types/api.types';
import type { CrossSellSuggestion } from '@/lib/api/crosssell.service';

import { MenuHeader } from '@/components/menu/MenuHeader';
import { CategoriesTabBar } from '@/components/menu/CategoriesTabBar';
import { MenuCard } from '@/components/menu/MenuCard';
import { ItemDetailsSheet } from '@/components/menu/ItemDetailsSheet';
import { BottomNavigation } from '@/components/ui/BottomNavigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function GuestMenuPage() {
  const params = useParams<{ slug: string; tableId: string }>();
  const slug = params.slug;
  const tableId = params.tableId;
  const router = useRouter();

  const { sessionToken, sessionUserId } = useSessionStore();
  const { categories, loading, error, setCategories, setLoading, setError, isCacheValid } = useMenuStore();

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItemResponse | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [crossSellSuggestions, setCrossSellSuggestions] = useState<CrossSellSuggestion[]>([]);
  const [showCrossSell, setShowCrossSell] = useState(false);

  // Redirect if no session
  useEffect(() => {
    if (!sessionToken || !sessionUserId) {
      router.replace(`/r/${slug}/t/${tableId}`);
    }
  }, [sessionToken, sessionUserId, router, slug, tableId]);

  // Fetch menu
  useEffect(() => {
    if (!slug || isCacheValid()) return;

    setLoading(true);
    menuService.getMenu(slug)
      .then((data) => {
        setCategories(data.categories);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar el menú');
      });
  }, [slug, isCacheValid, setCategories, setLoading, setError]);

  // Set first category active
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Fetch cart count
  useEffect(() => {
    if (!slug || !tableId) return;
    orderService.getSessionOrders(slug, tableId)
      .then((orders) => {
        const myOrders = orders.filter(o => o.session_user_id === sessionUserId && o.status === 'pending');
        setCartCount(myOrders.length);
      })
      .catch(() => {});
  }, [slug, tableId, sessionUserId]);

  const handleItemAdded = useCallback(async (itemId: string) => {
    setCartCount(c => c + 1);
    
    // Check for cross-sell suggestions
    try {
      const suggestions = await crossSellService.getSuggestions(slug, itemId);
      if (suggestions.length > 0) {
        setCrossSellSuggestions(suggestions);
        setShowCrossSell(true);
      }
    } catch {
      // Cross-sell not available, no big deal
    }
  }, [slug]);

  const activeCategoryData = categories.find(c => c.id === activeCategory);
  const activeCategoryItems = activeCategoryData?.items.filter(i => i.is_available) || [];
  const featuredItems = categories.flatMap(c => c.items.filter(i => i.is_featured && i.is_available));

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, ease: 'easeOut' as const } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
  };

  return (
    <div className="bg-background-dark font-[Inter] text-white min-h-[100dvh] flex flex-col antialiased">
      <div className="sticky top-0 z-50 flex flex-col w-full">
        <MenuHeader />
        <CategoriesTabBar categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      </div>

      <main className="flex-1 p-5 pb-[140px] max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]"><LoadingSpinner /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
            <div className="size-20 bg-danger/20 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-danger">wifi_off</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Error al cargar el menú</h2>
            <p className="text-text-muted mb-6 max-w-[280px]">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-primary/30 transition-all active:scale-95">
              Reintentar
            </button>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            {featuredItems.length > 0 && (
              <>
                <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4 pt-2">
                  <div className="bg-amber-500/20 text-amber-400 p-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-[20px] block">star</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Destacados</h3>
                </motion.div>
                <div className="grid gap-4">
                  {featuredItems.map(item => (
                    <MenuCard key={item.id} item={item} onOpen={setSelectedItem} variants={itemVariants} />
                  ))}
                </div>
              </>
            )}

            {activeCategoryData && activeCategoryItems.length > 0 && (
              <>
                <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4 pt-6">
                  <div className="bg-primary/20 text-primary p-1.5 rounded-lg">
                    <span className="material-symbols-outlined text-[20px] block">restaurant_menu</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">
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

            {activeCategoryItems.length === 0 && featuredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                <span className="material-symbols-outlined text-5xl text-text-muted mb-4">menu_book</span>
                <p className="text-text-muted">No hay ítems disponibles en esta categoría</p>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Floating Cart FAB */}
      <Link
        href={`/r/${slug}/t/${tableId}/cart`}
        className="fixed bottom-28 right-5 z-40 size-16 rounded-[20px] bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30 active:scale-90 hover:scale-[1.03] transition-all duration-300 ease-out group"
      >
        <span className="material-symbols-outlined text-[28px]">shopping_cart</span>
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-2 -right-2 bg-secondary text-white text-[12px] font-black min-w-[26px] h-[26px] px-1.5 rounded-full flex items-center justify-center border-4 border-background-dark shadow-sm"
            >
              {cartCount}
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      <BottomNavigation />
      <ItemDetailsSheet item={selectedItem} onClose={() => setSelectedItem(null)} />

      {/* Cross-sell modal */}
      <AnimatePresence>
        {showCrossSell && crossSellSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center"
            onClick={() => setShowCrossSell(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface rounded-t-3xl p-6 pb-10"
            >
              <div className="w-10 h-1 bg-neutral-border rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold mb-1">¿Quieres agregar también...?</h3>
              <p className="text-text-muted text-sm mb-4">Sugerencias para ti 🎯</p>
              <div className="space-y-3">
                {crossSellSuggestions.map((s) => (
                  <div key={s.item_id} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2">
                    {s.image_url && <img src={s.image_url} className="size-12 rounded-xl object-cover" alt="" />}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-primary text-sm font-bold">${s.discounted_price ? s.discounted_price.toFixed(2) : s.price_usd.toFixed(2)}</p>
                    </div>
                    {s.discount_pct > 0 && (
                      <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full font-bold">-{Math.round(s.discount_pct * 100)}%</span>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowCrossSell(false)}
                className="w-full mt-4 py-3 text-text-muted font-medium text-sm"
              >
                No, gracias
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
