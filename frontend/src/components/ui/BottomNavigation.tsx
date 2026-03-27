"use client";

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

export function BottomNavigation() {
  const pathname = usePathname();
  const params = useParams<{ slug: string; tableId: string }>();
  const slug = params.slug;
  const tableId = params.tableId;

  // Build dynamic base path for the current session
  const base = slug && tableId ? `/r/${slug}/t/${tableId}` : '';

  const menuPath = `${base}/menu`;
  const cartPath = `${base}/cart`;
  const checkoutPath = `${base}/checkout`;

  const profilePath = `${base}/profile`;

  const isActive = (path: string) => pathname === path;

  // Don't render if we don't have route params
  if (!base) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0B]/90 backdrop-blur-xl border-t border-white/5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] px-2 shadow-none">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link 
          className={`flex flex-1 flex-col items-center justify-center gap-1.5 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-lg ${isActive(menuPath) ? 'text-primary' : 'text-slate-400 hover:text-slate-200 transition-colors'}`} 
          href={menuPath} 
          aria-current={isActive(menuPath) ? "page" : undefined}
        >
          <div className={`flex p-2 items-center justify-center rounded-2xl transition-all duration-300 relative overflow-hidden group-active:scale-90 ${isActive(menuPath) ? 'bg-primary/10' : 'group-hover:bg-white/5'}`}>
            <span className={`material-symbols-outlined text-[26px] ${isActive(menuPath) ? 'relative z-10 drop-shadow-sm' : 'transition-transform group-hover:-translate-y-0.5'}`} style={{fontVariationSettings: isActive(menuPath) ? "'FILL' 1" : "'FILL' 0"}}>restaurant_menu</span>
          </div>
          <p className="text-[11px] font-bold leading-none tracking-wide">Menú</p>
        </Link>
        <Link 
          className={`flex flex-1 flex-col items-center justify-center gap-1.5 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-lg ${isActive(cartPath) ? 'text-primary' : 'text-slate-400 hover:text-slate-200 transition-colors'}`} 
          href={cartPath}
          aria-current={isActive(cartPath) ? "page" : undefined}
        >
          <div className={`flex p-2 items-center justify-center rounded-2xl transition-all duration-300 relative overflow-hidden group-active:scale-90 ${isActive(cartPath) ? 'bg-primary/10' : 'group-hover:bg-white/5'}`}>
            <span className={`material-symbols-outlined text-[26px] ${isActive(cartPath) ? 'relative z-10 drop-shadow-sm' : 'transition-transform group-hover:-translate-y-0.5'}`} style={{fontVariationSettings: isActive(cartPath) ? "'FILL' 1" : "'FILL' 0"}}>receipt_long</span>
          </div>
          <p className="text-[11px] font-semibold leading-none tracking-wide">Orden</p>
        </Link>
        <Link 
          className={`flex flex-1 flex-col items-center justify-center gap-1.5 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-lg ${isActive(checkoutPath) ? 'text-primary' : 'text-slate-400 hover:text-slate-200 transition-colors'}`}
          href={checkoutPath}
          aria-current={isActive(checkoutPath) ? "page" : undefined}
        >
          <div className={`flex p-2 items-center justify-center rounded-2xl transition-all duration-300 relative overflow-hidden group-active:scale-90 ${isActive(checkoutPath) ? 'bg-primary/10' : 'group-hover:bg-white/5'}`}>
            <span className={`material-symbols-outlined text-[26px] ${isActive(checkoutPath) ? 'relative z-10 drop-shadow-sm' : 'transition-transform group-hover:-translate-y-0.5'}`} style={{fontVariationSettings: isActive(checkoutPath) ? "'FILL' 1" : "'FILL' 0"}}>payments</span>
          </div>
          <p className="text-[11px] font-semibold leading-none tracking-wide">Pagar</p>
        </Link>
        <Link 
          className={`flex flex-1 flex-col items-center justify-center gap-1.5 group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-lg ${isActive(profilePath) ? 'text-primary' : 'text-slate-400 hover:text-slate-200 transition-colors'}`} 
          href={profilePath}
          aria-label="Perfil"
          aria-current={isActive(profilePath) ? "page" : undefined}
        >
          <div className={`flex p-2 items-center justify-center rounded-2xl transition-all duration-300 relative overflow-hidden group-active:scale-90 ${isActive(profilePath) ? 'bg-primary/10' : 'group-hover:bg-white/5'}`}>
            <span className={`material-symbols-outlined text-[26px] ${isActive(profilePath) ? 'relative z-10 drop-shadow-sm' : 'transition-transform group-hover:-translate-y-0.5'}`} style={{fontVariationSettings: isActive(profilePath) ? "'FILL' 1" : "'FILL' 0"}}>person</span>
          </div>
          <p className="text-[11px] font-semibold leading-none tracking-wide">Perfil</p>
        </Link>
      </div>
    </nav>
  );
}
