"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-safe left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-full max-w-sm px-4 pt-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto w-full flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md ${
                t.type === 'success' 
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200/50 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200' 
                  : t.type === 'error'
                  ? 'bg-red-50/90 dark:bg-red-950/90 border-red-200/50 dark:border-red-800/50 text-red-800 dark:text-red-200'
                  : 'bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">
                {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
              </span>
              <p className="flex-1 text-sm font-semibold tracking-tight break-words">{t.message}</p>
              <button 
                onClick={() => removeToast(t.id)}
                className="ml-auto shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
