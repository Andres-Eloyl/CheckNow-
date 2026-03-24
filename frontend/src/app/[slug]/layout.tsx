'use client';

import { useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { authService } from '@/lib/api/auth.service';
import { ThemeProvider } from '@/components/ThemeProvider';

const NAV_ITEMS = [
  { href: 'dashboard', icon: 'dashboard', label: 'Panel' },
  { href: 'kitchen', icon: 'restaurant', label: 'Cocina' },
  { href: 'payments', icon: 'payments', label: 'Pagos' },
  { href: 'menu-admin', icon: 'menu_book', label: 'Menú' },
  { href: 'tables-admin', icon: 'table_restaurant', label: 'Mesas' },
  { href: 'staff-admin', icon: 'people', label: 'Staff' },
  { href: 'cross-sell', icon: 'recommend', label: 'Cross-Sell', pro: true },
  { href: 'analytics', icon: 'analytics', label: 'Analytics', pro: true },
  { href: 'settings', icon: 'settings', label: 'Ajustes' },
  { href: 'subscription', icon: 'workspace_premium', label: 'Suscripción' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, role, staffName, logout } = useAuthStore();
  const { wsConnected, notifications } = useDashboardStore();

  // Auth guard
  useEffect(() => {
    if (!accessToken) {
      // Check if staff or owner
      if (role === 'staff') {
        router.replace(`/${slug}/staff-login`);
      } else {
        router.replace('/login');
      }
      return;
    }

    // Validate owner session
    if (role === 'owner') {
      authService.getMe().catch((err) => {
        console.error('Session validation failed:', err);
      });
    }
  }, [accessToken, role, slug, router]);

  if (!accessToken) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-[100dvh] bg-background-dark font-[Inter] text-white flex">
      <ThemeProvider slug={slug as string} />
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-neutral-border fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-neutral-border">
          <Link href={`/${slug}/dashboard`} className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">restaurant</span>
            </div>
            <div>
              <h1 className="text-sm font-black">CheckNow<span className="text-primary">!</span></h1>
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">{slug}</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 custom-scrollbar overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const fullHref = `/${slug}/${item.href}`;
            const isActive = pathname === fullHref || pathname?.startsWith(fullHref + '/');
            return (
              <Link key={item.href} href={fullHref}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-primary/20 text-primary shadow-sm'
                    : 'text-text-muted hover:bg-surface-2 hover:text-white'
                }`}>
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
                {item.pro && <span className="ml-auto text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-bold">PRO</span>}
                {item.href === 'payments' && unreadCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + status */}
        <div className="p-4 border-t border-neutral-border space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span className={`size-2 rounded-full ${wsConnected ? 'bg-success' : 'bg-danger'}`} />
            <span className="text-text-muted">{wsConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm">person</span>
              </div>
              <span className="text-sm font-medium truncate max-w-[120px]">{staffName || 'Admin'}</span>
            </div>
            <button onClick={logout} className="size-8 rounded-lg bg-surface-2 flex items-center justify-center text-text-muted hover:text-danger transition-colors" title="Cerrar sesión">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-neutral-border flex items-center justify-around py-2 pb-6">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const fullHref = `/${slug}/${item.href}`;
          const isActive = pathname === fullHref || pathname?.startsWith(fullHref + '/');
          return (
            <Link key={item.href} href={fullHref} className={`flex flex-col items-center gap-1 px-3 py-1 transition-all ${isActive ? 'text-primary' : 'text-text-muted'}`}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => {/* TODO: open more menu */}} className="flex flex-col items-center gap-1 px-3 py-1 text-text-muted">
          <span className="material-symbols-outlined text-xl">more_horiz</span>
          <span className="text-[10px] font-semibold">Más</span>
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-[100dvh] pb-24 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
