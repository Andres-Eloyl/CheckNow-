'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { crossSellService } from '@/lib/api/crosssell.service';
import { menuService } from '@/lib/api/menu.service';
import type { CrossSellRule, CrossSellRuleCreate, CrossSellRuleUpdate } from '@/lib/api/crosssell.service';
import type { MenuItemResponse } from '@/types/api.types';

export default function CrossSellPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [rules, setRules] = useState<CrossSellRule[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CrossSellRuleCreate>({ trigger_item_id: '', suggested_item_id: '', discount_pct: 0 });
  const [saving, setSaving] = useState(false);
  const [proLocked, setProLocked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      crossSellService.getRules(slug),
      menuService.getMenu(slug).then(m => m.categories.flatMap(c => c.items)),
    ]).then(([r, items]) => { setRules(r); setMenuItems(items); })
      .catch((err: unknown) => { if ((err as { status?: number })?.status === 402) setProLocked(true); })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await crossSellService.createRule(slug, form);
      setRules(prev => [...prev, created]);
      setShowModal(false);
      setForm({ trigger_item_id: '', suggested_item_id: '', discount_pct: 0 });
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await crossSellService.deleteRule(slug, id); setRules(prev => prev.filter(r => r.id !== id)); } catch {}
  };

  const handleToggle = async (rule: CrossSellRule) => {
    try {
      const updated = await crossSellService.updateRule(slug, rule.id, { is_active: !rule.is_active } as CrossSellRuleUpdate);
      setRules(prev => prev.map(r => r.id === rule.id ? updated : r));
    } catch {}
  };

  if (proLocked) {
    return (
      <div className="p-8 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="size-20 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-secondary text-4xl">workspace_premium</span>
        </div>
        <h1 className="text-2xl font-black mb-2">Función Pro</h1>
        <p className="text-text-muted max-w-sm mb-6">Cross-Sell está disponible con el plan Pro.</p>
        <a href={`/${slug}/subscription`} className="bg-primary text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-primary/30">Ver Planes</a>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">recommend</span> Cross-Sell
          </h1>
          <p className="text-text-muted text-sm mt-1">{rules.length} reglas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="h-10 px-5 bg-primary text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-lg">add</span> Nueva Regla
        </button>
      </div>

      <div className="space-y-3">
        {rules.map(rule => (
          <motion.div key={rule.id} layout className="p-5 rounded-2xl bg-surface border border-neutral-border flex items-center gap-4 group">
            <div className="flex-1 min-w-0">
              <p className="text-sm"><span className="text-text-muted">Cuando piden</span> <span className="font-bold text-primary">{rule.trigger_item_name}</span></p>
              <p className="text-sm"><span className="text-text-muted">→ Sugerir</span> <span className="font-bold text-secondary">{rule.suggested_item_name}</span></p>
              {rule.discount_pct && rule.discount_pct > 0 && <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded font-bold">-{Math.round(rule.discount_pct * 100)}%</span>}
            </div>
            <button onClick={() => handleToggle(rule)} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${rule.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
              {rule.is_active ? 'Activo' : 'Inactivo'}
            </button>
            <button onClick={() => handleDelete(rule.id)} className="size-8 rounded-lg bg-danger/20 text-danger flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-surface rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold">Nueva Regla Cross-Sell</h3>
              <div className="space-y-3">
                <div><label className="text-xs text-text-muted font-semibold">Cuando piden:</label>
                  <select value={form.trigger_item_id} onChange={e => setForm(f => ({ ...f, trigger_item_id: e.target.value }))}
                    className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Seleccionar item...</option>
                    {menuItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select></div>
                <div><label className="text-xs text-text-muted font-semibold">Sugerir:</label>
                  <select value={form.suggested_item_id} onChange={e => setForm(f => ({ ...f, suggested_item_id: e.target.value }))}
                    className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Seleccionar item...</option>
                    {menuItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select></div>
                <div><label className="text-xs text-text-muted font-semibold">Descuento (% como decimal, ej: 0.10 = 10%)</label>
                  <input type="number" step="0.01" min="0" max="1" value={form.discount_pct || 0} onChange={e => setForm(f => ({ ...f, discount_pct: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-primary/30" /></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 h-12 bg-surface-2 text-text-muted font-bold rounded-2xl">Cancelar</button>
                <button onClick={handleCreate} disabled={!form.trigger_item_id || !form.suggested_item_id || saving}
                  className="flex-1 h-12 bg-primary text-white font-bold rounded-2xl disabled:opacity-50">{saving ? '...' : 'Crear Regla'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
