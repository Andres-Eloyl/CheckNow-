"use client";

import { motion } from 'framer-motion';
import { MenuItem } from '@/types';
import React from 'react';

interface MenuCardProps {
  item: MenuItem;
  onOpen: (item: MenuItem) => void;
  variants?: any;
}

export const MenuCard = React.memo<MenuCardProps>(({ item, onOpen, variants }) => {
  const isVegan = item.name.includes("Bruschettas");
  const isTopSale = item.tag === 'Sugerencias del Chef';

  return (
    <motion.button 
      variants={variants}
      whileTap={{ scale: 0.97 }}
      onClick={() => onOpen(item)} 
      className="w-full text-left flex bg-white dark:bg-[#151516] p-4 rounded-[24px] border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm shadow-slate-200/20 dark:shadow-none transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary group"
    >
      <div className="flex-1 flex flex-col justify-between pr-4">
        <div>
          <h4 className="text-[17px] font-bold tracking-tight leading-tight text-slate-900 dark:text-white mb-1.5 group-hover:text-primary transition-colors">{item.name}</h4>
          <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed line-clamp-2">{item.description}</p>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <p className="text-primary text-lg font-black tracking-tight">${item.price.toFixed(2)}</p>
          {isVegan && (
            <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Vegano</span>
          )}
          {isTopSale && (
            <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Top Venta</span>
          )}
        </div>
      </div>
      <div className="size-28 lg:size-32 rounded-[18px] overflow-hidden shrink-0 shadow-sm border border-slate-100 dark:border-white/5 relative bg-slate-100 dark:bg-neutral-800">
        <img className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" alt={item.name} src={item.image} loading="lazy" />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
        {/* Plus Icon Overlay */}
        <div className="absolute bottom-2 right-2 size-8 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-full flex items-center justify-center text-primary shadow-sm transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <span className="material-symbols-outlined text-[20px]">add</span>
        </div>
      </div>
    </motion.button>
  );
});

MenuCard.displayName = 'MenuCard';
