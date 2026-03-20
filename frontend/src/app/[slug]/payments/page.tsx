'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { checkoutService } from '@/lib/api/checkout.service';
import { paymentService } from '@/lib/api/payment.service';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getStaffWebSocketUrl } from '@/lib/api/client';
import type { PaymentResponse } from '@/types/api.types';

const METHOD_LABELS: Record<string, { label: string; icon: string }> = {
  pago_movil: { label: 'Pago Móvil', icon: 'phone_android' },
  zelle: { label: 'Zelle', icon: 'currency_exchange' },
  efectivo_usd: { label: 'Efectivo $', icon: 'attach_money' },
  efectivo_ves: { label: 'Efectivo Bs.', icon: 'payments' },
  tarjeta: { label: 'Tarjeta', icon: 'credit_card' },
};

export default function PaymentsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { accessToken } = useAuthStore();
  const { setPendingPayments, addPendingPayment, removePayment, setWsConnected } = useDashboardStore();

  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'verified' | 'rejected'>('pending');

  const fetchPayments = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await paymentService.getPayments(slug);
      setPayments(data);
      setPendingPayments(data.filter((p: PaymentResponse) => p.status === 'pending'));
    } catch {} finally {
      setLoading(false);
    }
  }, [slug, setPendingPayments]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // WebSocket
  const wsUrl = accessToken ? getStaffWebSocketUrl(slug, accessToken) : '';
  useWebSocket({
    url: wsUrl,
    onConnect: () => setWsConnected(true),
    onDisconnect: () => setWsConnected(false),
    onMessage: (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === 'payment_pending') fetchPayments();
      } catch {}
    },
  });

  const handleVerify = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      await paymentService.verifyPayment(slug, paymentId);
      fetchPayments();
    } catch {} finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    setProcessing(rejectingId);
    try {
      await paymentService.rejectPayment(slug, rejectingId, { reason: rejectReason || 'Pago rechazado por el staff' });
      setRejectingId(null);
      setRejectReason('');
      fetchPayments();
    } catch {} finally {
      setProcessing(null);
    }
  };

  const filteredPayments = payments.filter(p => p.status === tab);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">payments</span>
            Cola de Pagos
          </h1>
          <p className="text-text-muted text-sm mt-1">{payments.filter(p => p.status === 'pending').length} pagos pendientes</p>
        </div>
        <button onClick={fetchPayments} className="size-10 rounded-xl bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors">
          <span className="material-symbols-outlined text-text-muted">refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-surface rounded-2xl">
        {(['pending', 'verified', 'rejected'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:text-white'
            }`}>
            {t === 'pending' ? `Pendientes (${payments.filter(p => p.status === 'pending').length})` : t === 'verified' ? 'Verificados' : 'Rechazados'}
          </button>
        ))}
      </div>

      {/* Payment cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredPayments.map(payment => {
            const method = METHOD_LABELS[payment.method] || { label: payment.method, icon: 'payment' };
            return (
              <motion.div key={payment.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}
                className="p-5 rounded-2xl bg-surface border border-neutral-border space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">{method.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{payment.user_alias || 'Comensal'}</p>
                      <p className="text-xs text-text-muted">Mesa {payment.table_number || '?'} • {method.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">${payment.amount_usd.toFixed(2)}</p>
                    {payment.amount_local && <p className="text-xs text-text-muted">Bs. {payment.amount_local.toFixed(2)}</p>}
                  </div>
                </div>

                {payment.reference_code && (
                  <div className="p-3 rounded-xl bg-surface-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-muted text-sm">tag</span>
                    <span className="text-sm font-mono font-bold">{payment.reference_code}</span>
                  </div>
                )}

                {payment.tip_amount > 0 && (
                  <p className="text-xs text-text-muted">💰 Propina: ${payment.tip_amount.toFixed(2)}</p>
                )}

                {tab === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleVerify(payment.id)} disabled={processing === payment.id}
                      className="flex-1 h-11 bg-success/20 text-success font-bold text-sm rounded-xl hover:bg-success/30 disabled:opacity-50 flex items-center justify-center gap-1 transition-all">
                      <span className="material-symbols-outlined text-lg">check_circle</span> Verificar
                    </button>
                    <button onClick={() => setRejectingId(payment.id)} disabled={processing === payment.id}
                      className="flex-1 h-11 bg-danger/20 text-danger font-bold text-sm rounded-xl hover:bg-danger/30 disabled:opacity-50 flex items-center justify-center gap-1 transition-all">
                      <span className="material-symbols-outlined text-lg">cancel</span> Rechazar
                    </button>
                  </div>
                )}

                {tab === 'rejected' && payment.rejection_reason && (
                  <p className="text-xs text-danger italic">Razón: {payment.rejection_reason}</p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredPayments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-text-muted mb-4 opacity-30">inbox</span>
            <p className="text-text-muted font-medium">No hay pagos {tab === 'pending' ? 'pendientes' : tab === 'verified' ? 'verificados' : 'rechazados'}</p>
          </div>
        )}
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" onClick={() => setRejectingId(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-surface rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold">Rechazar Pago</h3>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Razón del rechazo (opcional)"
                className="w-full h-24 bg-surface-2 border border-neutral-border rounded-2xl p-4 text-sm text-white placeholder:text-text-muted outline-none resize-none focus:ring-2 focus:ring-primary/30" />
              <div className="flex gap-3">
                <button onClick={() => setRejectingId(null)} className="flex-1 h-12 bg-surface-2 text-text-muted font-bold rounded-2xl">Cancelar</button>
                <button onClick={handleReject} disabled={processing === rejectingId}
                  className="flex-1 h-12 bg-danger text-white font-bold rounded-2xl disabled:opacity-50">Rechazar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
