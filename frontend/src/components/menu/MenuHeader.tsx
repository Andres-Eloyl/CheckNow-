"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONSTANTS } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { useSessionStore } from '@/stores/session.store';

export function MenuHeader() {
  const [greeting, setGreeting] = useState('Hola');
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  
  const { session, alias, tableNumber } = useSessionStore();
  const userAlias = alias || 'Tú';
  const tableAlias = tableNumber ? `Mesa ${tableNumber}` : 'Mesa';

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 20) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
    
    const interval = setInterval(() => {
      // Social proof temporarily disabled as it relies on mocks that may not exist.
    }, APP_CONSTANTS.SOCIAL_PROOF_INTERVAL_MS * 2);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <motion.header 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-20 bg-background-dark border-b border-neutral-border pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 px-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <Avatar alias={userAlias} size="md" className="border-2 border-primary shadow-sm" />
            {/* Online indicator dot */}
            <div className="absolute bottom-0 right-0 size-3 rounded-full bg-success border-2 border-background-dark"></div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-[13px] font-semibold text-text-muted leading-tight">
              {greeting}, <span className="font-bold text-white/80 italic">{tableAlias}</span>
            </h2>
            <h1 className="text-xl font-black tracking-tight text-white leading-tight">
              ¿Qué se te antoja? 😋
            </h1>
          </div>
        </div>
        
        <motion.button 
          whileTap={{ scale: 0.94 }}
          className="flex items-center justify-center bg-primary text-white size-11 rounded-full shadow-md shadow-primary/25 active:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 shrink-0 group relative"
          aria-label="Llamar Mesero"
          title="Llamar Mesero"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-80"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary border-2 border-primary"></span>
          </span>
          <span className="material-symbols-outlined text-[20px] group-hover:animate-pulse">room_service</span>
        </motion.button>
      </motion.header>

      {/* Dynamic Island Social Proof Toast */}
      <div className="fixed top-[88px] left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
        <AnimatePresence>
          {socialMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, y: -10, filter: 'blur(4px)' }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="glass text-white backdrop-blur-xl text-sm font-semibold py-2.5 px-4 pr-5 rounded-full shadow-[0_16px_32px_-8px_rgba(0,0,0,0.3)] flex items-center gap-3"
            >
              <div className="bg-primary/20 text-primary p-1 rounded-full flex shrink-0">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
              </div>
              <span className="line-clamp-1 truncate tracking-tight">{socialMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
