"use client";

import { motion } from 'framer-motion';
import type { MenuCategoryFull } from '@/types/api.types';

interface CategoriesTabBarProps {
  categories: MenuCategoryFull[];
  activeCategory: string;
  setActiveCategory: (id: string) => void;
}

export function CategoriesTabBar({ categories, activeCategory, setActiveCategory }: CategoriesTabBarProps) {
  return (
    <nav className="relative z-10 bg-background-dark border-b border-neutral-border py-3 overflow-hidden">
      <div className="relative">
        {/* Gradient indicators for scrolling */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background-dark to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background-dark to-transparent z-10 pointer-events-none"></div>
        
        <div 
          className="flex overflow-x-auto hide-scrollbar px-5 gap-2.5 snap-x snap-proximity scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative px-6 py-2.5 rounded-full shrink-0 flex items-center justify-center font-bold text-[14px] tracking-wide transition-all snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  isActive 
                    ? 'text-white shadow-md shadow-primary/20' 
                    : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10 border border-neutral-border'
                }`}
                aria-pressed={isActive}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-primary rounded-full z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.icon ? `${cat.icon} ` : ''}{cat.name}</span>
              </button>
            )
          })}
          {/* Spacer for final item to allow better scroll ending */}
          <div className="shrink-0 w-5"></div>
        </div>
      </div>
    </nav>
  );
}
