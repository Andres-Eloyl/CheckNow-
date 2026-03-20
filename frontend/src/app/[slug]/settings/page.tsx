'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { configService } from '@/lib/api/config.service';
import type { RestaurantConfigResponse, RestaurantConfigUpdate } from '@/types/api.types';

export default function SettingsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [config, setConfig] = useState<RestaurantConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<RestaurantConfigUpdate>({});

  useEffect(() => {
    if (!slug) return;
    configService.getConfig(slug)
      .then(data => { setConfig(data); setForm(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await configService.updateConfig(slug, form);
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {} finally { setSaving(false); }
  };

  const update = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">settings</span> Configuración
        </h1>
        <button onClick={handleSave} disabled={saving}
          className="h-10 px-5 bg-primary text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50">
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Branding */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border space-y-4">
          <h2 className="font-bold text-sm text-text-muted uppercase tracking-wider">🎨 Branding</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-text-muted font-semibold block mb-1">Color Primario</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.primary_color || '#6C63FF'} onChange={e => update('primary_color', e.target.value)} className="size-10 rounded-lg bg-transparent cursor-pointer" />
                <span className="text-sm text-text-muted font-mono">{form.primary_color || '#6C63FF'}</span>
              </div>
            </div>
            <div><label className="text-xs text-text-muted font-semibold block mb-1">Color Secundario</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.secondary_color || '#FF6B35'} onChange={e => update('secondary_color', e.target.value)} className="size-10 rounded-lg bg-transparent cursor-pointer" />
                <span className="text-sm text-text-muted font-mono">{form.secondary_color || '#FF6B35'}</span>
              </div>
            </div>
          </div>
          <div><label className="text-xs text-text-muted font-semibold block mb-1">Logo URL</label>
            <input value={form.logo_url || ''} onChange={e => update('logo_url', e.target.value)} placeholder="https://..." 
              className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" /></div>
        </div>

        {/* Operations */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border space-y-4">
          <h2 className="font-bold text-sm text-text-muted uppercase tracking-wider">⚙️ Operación</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-text-muted font-semibold block mb-1">Impuesto (%)</label>
              <input type="number" step="0.01" value={form.tax_rate ?? 16} onChange={e => update('tax_rate', parseFloat(e.target.value))}
                className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="text-xs text-text-muted font-semibold block mb-1">Cargo por Servicio (%)</label>
              <input type="number" step="0.01" value={form.service_charge ?? 10} onChange={e => update('service_charge', parseFloat(e.target.value))}
                className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-primary/30" /></div>
          </div>
        </div>

        {/* WiFi */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border space-y-4">
          <h2 className="font-bold text-sm text-text-muted uppercase tracking-wider">📶 WiFi para clientes</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-text-muted font-semibold block mb-1">SSID (nombre de red)</label>
              <input value={form.wifi_ssid || ''} onChange={e => update('wifi_ssid', e.target.value)} placeholder="MiRestaurante-WiFi"
                className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" /></div>
            <div><label className="text-xs text-text-muted font-semibold block mb-1">Contraseña WiFi</label>
              <input value={form.wifi_password || ''} onChange={e => update('wifi_password', e.target.value)} placeholder="••••••••"
                className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" /></div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border space-y-4">
          <h2 className="font-bold text-sm text-text-muted uppercase tracking-wider">💳 Métodos de Pago Aceptados</h2>
          <div className="grid grid-cols-2 gap-3">
            {['pago_movil', 'zelle', 'efectivo_usd', 'efectivo_ves', 'tarjeta'].map(method => {
              const labels: Record<string, string> = { pago_movil: 'Pago Móvil', zelle: 'Zelle', efectivo_usd: 'Efectivo USD', efectivo_ves: 'Efectivo VES', tarjeta: 'Tarjeta' };
              const isActive = (form.accepted_methods as string[] || []).includes(method);
              return (
                <button key={method} onClick={() => {
                  const current = (form.accepted_methods as string[]) || [];
                  update('accepted_methods', isActive ? current.filter(m => m !== method) : [...current, method]);
                }} className={`p-3 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-primary/20 border border-primary/30 text-primary' : 'bg-surface-2 text-text-muted'}`}>
                  {labels[method] || method}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
