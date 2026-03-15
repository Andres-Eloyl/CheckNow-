"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#0A0A0B]/85 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] dark:shadow-none">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link 
          className={`flex flex-1 flex-col items-center justify-center gap-1.5 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-lg ${isActive('/menu') ? 'text-primary' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors'}`} 
          href="/menu" 
          aria-current={isActive('/menu') ? "page" : undefined}
        >
          <div className={`flex p-2 items-center justify-center rounded-2xl transition-all duration-300 relative overflow-hidden group-active:scale-90 ${isActive('/menu') ? 'bg-primary/10' : 'group-hover:bg-slate-100 dark:group-hover:bg-white/5'}`}>
            <span className={`material-symbols-outlined text-[26px] ${isActive('/menu') ? 'relative z-10 drop-shadow-sm' : 'transition-transform group-hover:-translate-y-0.5'}`} style={{fontVariationSettings: isActive('/menu') ? "'FILL' 1" : "'FILL' 0"}}>restaurant_menu</span>
          </div>
          <p className="text-[11px] font-bold leading-none tracking-wide">Menú</p>
        </Link>
        <Link 
          className={`flex flex-1 flex-col items-center justify-center gap-1.5 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-lg ${isActive('/cart') ? 'text-primary' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors'}`} 
          href="/cart"
          aria-current={isActive('/cart') ? "page" : undefined}
        >
          <div className={`flex p-2 items-center justify-center rounded-2xl transition-all duration-300 relative overflow-hidden group-active:scale-90 ${isActive('/cart') ? 'bg-primary/10' : 'group-hover:bg-slate-100 dark:group-hover:bg-white/5'}`}>
            <span className={`material-symbols-outlined text-[26px] ${isActive('/cart') ? 'relative z-10 drop-shadow-sm' : 'transition-transform group-hover:-translate-y-0.5'}`} style={{fontVariationSettings: isActive('/cart') ? "'FILL' 1" : "'FILL' 0"}}>receipt_long</span>
          </div>
          <p className="text-[11px] font-semibold leading-none tracking-wide">Orden</p>
        </Link>
        <button type="button" className="flex flex-1 flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-lg transition-colors">
          <div className="flex p-2 items-center justify-center rounded-2xl group-hover:bg-slate-100 dark:group-hover:bg-white/5 group-active:scale-90 transition-all duration-300">
            <span className="material-symbols-outlined text-[26px] transition-transform group-hover:-translate-y-0.5" style={{fontVariationSettings: "'FILL' 0"}}>favorite</span>
          </div>
          <p className="text-[11px] font-semibold leading-none tracking-wide">Favoritos</p>
        </button>
        <Link 
          className={`flex flex-1 flex-col items-center justify-center gap-1.5 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-lg ${isActive('/join') ? 'text-primary' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors'}`} 
          href="/join"
          aria-current={isActive('/join') ? "page" : undefined}
        >
          <div className={`flex p-2 items-center justify-center rounded-2xl transition-all duration-300 relative overflow-hidden group-active:scale-90 ${isActive('/join') ? 'bg-primary/10' : 'group-hover:bg-slate-100 dark:group-hover:bg-white/5'}`}>
            <span className={`material-symbols-outlined text-[26px] ${isActive('/join') ? 'relative z-10 drop-shadow-sm' : 'transition-transform group-hover:-translate-y-0.5'}`} style={{fontVariationSettings: isActive('/join') ? "'FILL' 1" : "'FILL' 0"}}>person</span>
          </div>
          <p className="text-[11px] font-semibold leading-none tracking-wide">Perfil</p>
        </Link>
      </div>
    </nav>
  );
}
