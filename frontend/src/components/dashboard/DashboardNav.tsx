'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard/comandas', icon: 'receipt_long', label: 'Comandas' },
  { href: '/dashboard/menu', icon: 'restaurant_menu', label: 'Menú' },
];

export function DashboardNav() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('staff_token');
    window.location.href = '/dashboard/login';
  };

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-primary/15 bg-[#1a120d]">
      {/* Logo */}
      <div className="p-5 border-b border-primary/10">
        <h1 className="text-lg font-bold text-primary tracking-tight">CheckNow</h1>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Panel Admin</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-3 border-t border-primary/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-400 py-2 rounded-lg hover:bg-red-500/5 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
