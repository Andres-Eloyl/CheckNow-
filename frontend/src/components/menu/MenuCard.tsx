"use client";

import { motion } from 'framer-motion';
import type { MenuItemResponse } from '@/types/api.types';
import React from 'react';

interface MenuCardProps {
  item: MenuItemResponse;
  onOpen: (item: MenuItemResponse) => void;
  variants?: any;
}

export const MenuCard = React.memo<MenuCardProps>(({ item, onOpen, variants }) => {
  const placeholderImage = 'https://placehold.co/400x400/1a1a1b/666?text=🍽️';

  return (
    <motion.button 
      variants={variants}
      whileTap={{ scale: 0.97 }}
      onClick={() => onOpen(item)} 
      className="w-full text-left flex bg-surface p-4 rounded-[24px] border border-neutral-border hover:border-white/10 shadow-none transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary group"
    >
      <div className="flex-1 flex flex-col justify-between pr-4">
        <div>
          <h4 className="text-[17px] font-bold tracking-tight leading-tight text-white mb-1.5 group-hover:text-primary transition-colors">{item.name}</h4>
          <p className="text-text-muted text-[13px] leading-relaxed line-clamp-2">{item.description || ''}</p>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <p className="text-primary text-lg font-black tracking-tight">${item.price_usd.toFixed(2)}</p>
          {item.is_featured && (
            <span className="bg-warning/20 text-warning text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Destacado</span>
          )}
          {item.tags?.includes('vegano') && (
            <span className="bg-success/20 text-success text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Vegano</span>
          )}
        </div>
      </div>
      <div className="size-28 lg:size-32 rounded-[18px] overflow-hidden shrink-0 shadow-sm border border-neutral-border relative bg-surface-2">
        <img className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" alt={item.name} src={item.image_url || placeholderImage} loading="lazy" />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
        {/* Plus Icon Overlay */}
        <div className="absolute bottom-2 right-2 size-8 bg-surface/90 backdrop-blur-md rounded-full flex items-center justify-center text-primary shadow-sm transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <span className="material-symbols-outlined text-[20px]">add</span>
        </div>
      </div>
    </motion.button>
  );
});

MenuCard.displayName = 'MenuCard';
