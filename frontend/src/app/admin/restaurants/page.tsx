'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminService } from '@/lib/api/admin.service';
import { useAuthStore } from '@/stores/auth.store';
import type { AdminRestaurant } from '@/lib/api/admin.service';

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) { router.replace('/admin/login'); return; }
    adminService.getRestaurants()
      .then(setRestaurants)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, router]);

  const handleSuspend = async (id: string) => {
    setProcessing(id);
    try {
      await adminService.suspendRestaurant(id);
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_active: false } : r));
    } catch {} finally { setProcessing(null); }
  };

  const handleActivate = async (id: string) => {
    setProcessing(id);
    try {
      await adminService.activateRestaurant(id);
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_active: true } : r));
    } catch {} finally { setProcessing(null); }
  };

  const handleAssignPlan = async (id: string, planName: string) => {
    try {
      await adminService.assignPlan(id, { plan_id: planName, period_months: 1, amount: 0, payment_ref: 'admin-assign' });
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, plan_name: planName } : r));
    } catch {}
  };

  const filtered = restaurants.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0a14]"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>;

  return (
    <div className="min-h-[100dvh] bg-[#0a0a14] font-[Inter] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 glass border-b border-neutral-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-danger/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-danger text-lg">shield</span>
            </div>
            <h1 className="font-black text-sm">SuperAdmin</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/plans" className="h-9 px-4 bg-surface text-text-muted font-bold text-xs rounded-lg flex items-center gap-2 border border-neutral-border hover:border-primary/20">
              <span className="material-symbols-outlined text-sm">workspace_premium</span> Planes
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black">Restaurantes</h2>
            <p className="text-text-muted text-sm">{restaurants.length} registrados</p>
          </div>
          <div className="relative w-80">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-lg">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o slug..."
              className="w-full h-11 pl-11 pr-4 bg-surface border border-neutral-border rounded-xl text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl glass"><p className="text-xs text-text-muted">Total</p><p className="text-2xl font-black">{restaurants.length}</p></div>
          <div className="p-4 rounded-2xl glass"><p className="text-xs text-text-muted">Activos</p><p className="text-2xl font-black text-success">{restaurants.filter(r => r.is_active).length}</p></div>
          <div className="p-4 rounded-2xl glass"><p className="text-xs text-text-muted">Suspendidos</p><p className="text-2xl font-black text-danger">{restaurants.filter(r => !r.is_active).length}</p></div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-surface border border-neutral-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-neutral-border text-text-muted text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-semibold">Restaurante</th>
                <th className="text-left p-4 font-semibold">Slug</th>
                <th className="text-left p-4 font-semibold">Plan</th>
                <th className="text-left p-4 font-semibold">Estado</th>
                <th className="text-left p-4 font-semibold">Creado</th>
                <th className="text-right p-4 font-semibold">Acciones</th>
              </tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-neutral-border/50 hover:bg-surface-2 transition-colors">
                    <td className="p-4 font-bold">{r.name}</td>
                    <td className="p-4 text-text-muted font-mono text-xs">{r.slug}</td>
                    <td className="p-4">
                      <select value={r.plan_name || 'Free'} onChange={e => handleAssignPlan(r.id, e.target.value)}
                        className="h-8 bg-surface-2 border border-neutral-border rounded-lg px-2 text-white text-xs outline-none cursor-pointer">
                        <option value="Free">Free</option>
                        <option value="Starter">Starter</option>
                        <option value="Pro">Pro</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        {r.is_active ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="p-4 text-text-muted text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString('es-VE') : '—'}</td>
                    <td className="p-4 text-right">
                      {r.is_active ? (
                        <button onClick={() => handleSuspend(r.id)} disabled={processing === r.id}
                          className="h-8 px-3 bg-danger/20 text-danger text-xs font-bold rounded-lg hover:bg-danger/30 disabled:opacity-50">Suspender</button>
                      ) : (
                        <button onClick={() => handleActivate(r.id)} disabled={processing === r.id}
                          className="h-8 px-3 bg-success/20 text-success text-xs font-bold rounded-lg hover:bg-success/30 disabled:opacity-50">Activar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
