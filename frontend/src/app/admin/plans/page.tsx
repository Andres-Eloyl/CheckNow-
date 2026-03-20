'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminService } from '@/lib/api/admin.service';
import { useAuthStore } from '@/stores/auth.store';
import type { AdminPlan } from '@/lib/api/admin.service';

export default function AdminPlansPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', price_monthly: 0, price_yearly: 0, max_tables: 5, max_staff_users: 3, analytics_enabled: false, cross_sell_enabled: false, loyalty_enabled: false, commission_rate: 5,
  });

  useEffect(() => {
    if (!accessToken) { router.replace('/admin/login'); return; }
    adminService.getPlans()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminService.updatePlan(editing.id, form);
        setPlans(prev => prev.map(p => p.id === editing.id ? updated : p));
      } else {
        const created = await adminService.createPlan(form);
        setPlans(prev => [...prev, created]);
      }
      setShowModal(false);
      setEditing(null);
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este plan? Los restaurantes asignados se moverán al plan Free.')) return;
    try { await adminService.deletePlan(id); setPlans(prev => prev.filter(p => p.id !== id)); } catch {}
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', price_monthly: 0, price_yearly: 0, max_tables: 5, max_staff_users: 3, analytics_enabled: false, cross_sell_enabled: false, loyalty_enabled: false, commission_rate: 5 });
    setShowModal(true);
  };
  const openEdit = (plan: AdminPlan) => {
    setEditing(plan);
    setForm({ name: plan.name, price_monthly: plan.price_monthly ?? 0, price_yearly: plan.price_yearly ?? 0, max_tables: plan.max_tables, max_staff_users: plan.max_staff_users, analytics_enabled: plan.analytics_enabled, cross_sell_enabled: plan.cross_sell_enabled, loyalty_enabled: plan.loyalty_enabled, commission_rate: plan.commission_rate });
    setShowModal(true);
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0a14]"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>;

  return (
    <div className="min-h-[100dvh] bg-[#0a0a14] font-[Inter] text-white">
      <header className="sticky top-0 z-50 glass border-b border-neutral-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-danger/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-danger text-lg">shield</span>
            </div>
            <h1 className="font-black text-sm">SuperAdmin</h1>
          </div>
          <Link href="/admin/restaurants" className="h-9 px-4 bg-surface text-text-muted font-bold text-xs rounded-lg flex items-center gap-2 border border-neutral-border hover:border-primary/20">
            <span className="material-symbols-outlined text-sm">storefront</span> Restaurantes
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span> Planes
          </h2>
          <button onClick={openCreate} className="h-10 px-5 bg-primary text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg">add</span> Nuevo Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-6 rounded-2xl bg-surface border border-neutral-border hover:border-primary/20 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-black">{plan.name}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(plan)} className="size-7 rounded-lg bg-surface-2 flex items-center justify-center text-text-muted hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => handleDelete(plan.id)} className="size-7 rounded-lg bg-danger/20 flex items-center justify-center text-danger hover:bg-danger/30 transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
              <p className="text-3xl font-black text-primary mb-4">${plan.price_monthly}<span className="text-sm text-text-muted">/mes</span></p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Mesas</span><span className="font-bold">{plan.max_tables}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Staff</span><span className="font-bold">{plan.max_staff_users}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Analytics</span><span>{plan.analytics_enabled ? '✅' : '❌'}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Cross-Sell</span><span>{plan.cross_sell_enabled ? '✅' : '❌'}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Loyalty</span><span>{plan.loyalty_enabled ? '✅' : '❌'}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Comisión</span><span className="font-bold">{plan.commission_rate}%</span></div>
              </div>
              {plan.restaurant_count != null && (
                <p className="text-xs text-text-muted mt-4 pt-3 border-t border-neutral-border">{plan.restaurant_count} restaurantes asignados</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" onClick={() => setShowModal(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()} className="w-full max-w-md bg-surface rounded-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <h3 className="text-lg font-bold">{editing ? 'Editar Plan' : 'Nuevo Plan'}</h3>
                <div className="space-y-3">
                  <div><label className="text-xs text-text-muted font-semibold">Nombre</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Pro" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-text-muted font-semibold">Precio/mes ($)</label>
                      <input type="number" step="0.01" value={form.price_monthly} onChange={e => setForm(f => ({ ...f, price_monthly: parseFloat(e.target.value) || 0 }))}
                        className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-primary/30" /></div>
                    <div><label className="text-xs text-text-muted font-semibold">Comisión (%)</label>
                      <input type="number" step="0.1" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: parseFloat(e.target.value) || 0 }))}
                        className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-text-muted font-semibold">Max Mesas</label>
                      <input type="number" value={form.max_tables} onChange={e => setForm(f => ({ ...f, max_tables: parseInt(e.target.value) || 1 }))}
                        className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-primary/30" /></div>
                    <div><label className="text-xs text-text-muted font-semibold">Max Staff</label>
                      <input type="number" value={form.max_staff_users} onChange={e => setForm(f => ({ ...f, max_staff_users: parseInt(e.target.value) || 1 }))}
                        className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-text-muted font-semibold">Features</label>
                    {(['analytics_enabled', 'cross_sell_enabled', 'loyalty_enabled'] as const).map(feat => (
                      <label key={feat} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={form[feat]} onChange={e => setForm(f => ({ ...f, [feat]: e.target.checked }))}
                          className="size-5 rounded bg-surface-2 border-neutral-border accent-primary" />
                        <span className="text-sm capitalize">{feat.replace('_', '-')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="flex-1 h-12 bg-surface-2 text-text-muted font-bold rounded-2xl">Cancelar</button>
                  <button onClick={handleSave} disabled={!form.name || saving}
                    className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl disabled:opacity-50">{saving ? '...' : 'Guardar'}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
