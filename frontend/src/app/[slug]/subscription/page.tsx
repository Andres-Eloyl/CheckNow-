'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { subscriptionService } from '@/lib/api/subscription.service';
import type { SubscriptionStatus, PlanInfo } from '@/lib/api/subscription.service';

export default function SubscriptionPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      subscriptionService.getStatus(slug).catch(() => null),
      subscriptionService.getPlans(slug).catch(() => []),
    ]).then(([s, p]) => { if (s) setStatus(s); setPlans(p); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span> Mi Suscripción
      </h1>

      {/* Current status */}
      {status && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl glass mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Plan {status.plan_name}</h2>
              {status.is_trial && (
                <p className="text-sm text-warning font-medium">⏳ Prueba gratis — {status.trial_days_remaining || 0} días restantes</p>
              )}
            </div>
            <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">verified</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-surface-2"><p className="text-xs text-text-muted mb-1">Mesas</p>
              <p className="font-black text-lg">{status.tables_used} <span className="text-text-muted text-sm font-medium">/ {status.tables_max}</span></p></div>
            <div className="p-3 rounded-xl bg-surface-2"><p className="text-xs text-text-muted mb-1">Staff</p>
              <p className="font-black text-lg">{status.staff_used} <span className="text-text-muted text-sm font-medium">/ {status.staff_max}</span></p></div>
            <div className="p-3 rounded-xl bg-surface-2"><p className="text-xs text-text-muted mb-1">Analytics</p>
              <p className="font-black text-lg">{status.analytics_enabled ? '✅' : '❌'}</p></div>
            <div className="p-3 rounded-xl bg-surface-2"><p className="text-xs text-text-muted mb-1">Cross-Sell</p>
              <p className="font-black text-lg">{status.cross_sell_enabled ? '✅' : '❌'}</p></div>
          </div>
        </motion.div>
      )}

      {/* Plan comparison */}
      <h2 className="text-lg font-bold mb-4">Planes Disponibles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => {
          const isCurrentPlan = status?.plan_name === plan.name;
          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`p-6 rounded-2xl border transition-all ${isCurrentPlan ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-neutral-border bg-surface'}`}>
              {isCurrentPlan && <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-bold mb-3 inline-block">Plan Actual</span>}
              <h3 className="text-xl font-black mb-1">{plan.name}</h3>
              <p className="text-3xl font-black text-primary mb-4">${plan.price_monthly}<span className="text-sm text-text-muted font-medium">/mes</span></p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><span className="text-success">✓</span> {plan.max_tables} mesas</li>
                <li className="flex items-center gap-2"><span className="text-success">✓</span> {plan.max_staff} empleados</li>
                <li className="flex items-center gap-2"><span className={plan.analytics ? 'text-success' : 'text-text-muted'}>{plan.analytics ? '✓' : '✗'}</span> Analytics</li>
                <li className="flex items-center gap-2"><span className={plan.cross_sell ? 'text-success' : 'text-text-muted'}>{plan.cross_sell ? '✓' : '✗'}</span> Cross-Sell</li>
                <li className="flex items-center gap-2"><span className={plan.loyalty ? 'text-success' : 'text-text-muted'}>{plan.loyalty ? '✓' : '✗'}</span> Loyalty</li>
                <li className="flex items-center gap-2 text-text-muted text-xs">{plan.commission_rate}% comisión</li>
              </ul>
              {!isCurrentPlan && (
                <button className="w-full mt-4 h-11 bg-primary/20 text-primary font-bold text-sm rounded-xl hover:bg-primary/30 transition-all">Contactar para Upgrade</button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
