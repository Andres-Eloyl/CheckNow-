'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { analyticsService } from '@/lib/api/analytics.service';
import type { SalesByDay, TopItem, PeakHour, PaymentMethodStat } from '@/lib/api/analytics.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#6C63FF', '#FF6B35', '#22C55E', '#F59E0B', '#EC4899'];

export default function AnalyticsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [salesByDay, setSalesByDay] = useState<SalesByDay[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [proLocked, setProLocked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      analyticsService.getSalesByDay(slug, days),
      analyticsService.getTopItems(slug, days),
      analyticsService.getPeakHours(slug, days),
      analyticsService.getPaymentMethods(slug, days),
    ]).then(([sales, items, hours, methods]) => {
      setSalesByDay(sales);
      setTopItems(items);
      setPeakHours(hours);
      setPaymentMethods(methods);
    }).catch((err: unknown) => {
      if ((err as { status?: number })?.status === 402) setProLocked(true);
    }).finally(() => setLoading(false));
  }, [slug, days]);

  if (proLocked) {
    return (
      <div className="p-8 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="size-20 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-secondary text-4xl">workspace_premium</span>
        </div>
        <h1 className="text-2xl font-black mb-2">Función Pro</h1>
        <p className="text-text-muted max-w-sm mb-6">Analytics está disponible con el plan Pro. Actualiza para ver métricas detalladas de tu restaurante.</p>
        <a href={`/${slug}/subscription`} className="bg-primary text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-primary/30">Ver Planes</a>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">analytics</span>
            Analytics
          </h1>
        </div>
        <div className="flex gap-2 bg-surface rounded-xl p-1">
          {[7, 15, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${days === d ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Day */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl glass col-span-full">
          <h3 className="font-bold mb-4">📈 Ventas por Día (USD)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#8B8BA4', fontSize: 10 }} tickFormatter={v => new Date(v).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })} />
              <YAxis tick={{ fill: '#8B8BA4', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1A1A24', border: '1px solid #2D2D3D', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#8B8BA4' }} />
              <Bar dataKey="total_usd" fill="#6C63FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Items */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl glass">
          <h3 className="font-bold mb-4">🏆 Top Items</h3>
          <div className="space-y-3">
            {topItems.slice(0, 8).map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-text-muted w-5">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="h-2 bg-surface-2 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(item.quantity_sold / (topItems[0]?.quantity_sold || 1)) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
                <span className="text-xs text-text-muted font-bold">{item.quantity_sold} vendidos</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl glass">
          <h3 className="font-bold mb-4">💳 Métodos de Pago</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentMethods} dataKey="count" nameKey="method" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                {paymentMethods.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1A1A24', border: '1px solid #2D2D3D', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {paymentMethods.map((m, i) => (
              <div key={m.method} className="flex items-center gap-1.5">
                <div className="size-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-xs text-text-muted">{m.method}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
