'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSessionStore } from '@/stores/session.store';
import { checkoutService } from '@/lib/api/checkout.service';
import { restaurantService } from '@/lib/api/restaurant.service';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getComensalWebSocketUrl } from '@/lib/api/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { CheckoutSummary, ExchangeRateResponse, PaymentCreate, RestaurantPublic } from '@/types/api.types';

const VENEZUELAN_BANKS = [
  'Banesco', 'Mercantil', 'BBVA Provincial', 'BNC', 'Banco de Venezuela',
  'Banco Exterior', 'Bancaribe', 'Banco Nacional de Crédito', 'Banco Caroní',
  'Banco Sofitasa', 'Banco del Tesoro', 'Bancrecer', '100% Banco', 'Banco Activo',
  'Banco Bicentenario', 'Banco Fondo Común', 'Mi Banco', 'Banco Plaza',
];

const PAYMENT_METHODS = [
  { id: 'pago_movil', label: 'Pago Móvil', icon: 'phone_android', color: 'text-blue-400' },
  { id: 'zelle', label: 'Zelle', icon: 'currency_exchange', color: 'text-purple-400' },
  { id: 'efectivo_usd', label: 'Efectivo USD', icon: 'attach_money', color: 'text-green-400' },
  { id: 'efectivo_ves', label: 'Efectivo VES', icon: 'payments', color: 'text-amber-400' },
  { id: 'tarjeta', label: 'Tarjeta', icon: 'credit_card', color: 'text-cyan-400' },
];

const TIP_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '10%', value: 0.10 },
  { label: '15%', value: 0.15 },
  { label: '20%', value: 0.20 },
];

export default function GuestCheckoutPage() {
  const params = useParams<{ slug: string; tableId: string }>();
  const slug = params.slug;
  const tableId = params.tableId;
  const router = useRouter();
  const { sessionUserId, alias } = useSessionStore();

  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateResponse | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTip, setSelectedTip] = useState(0.10);
  const [customTip, setCustomTip] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'verified' | 'rejected'>('idle');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Payment form fields
  const [pagoMovilData, setPagoMovilData] = useState({ banco: '', telefono: '', cedula: '', referencia: '' });
  const [zelleData, setZelleData] = useState({ email: '', referencia: '' });

  useEffect(() => {
    if (!sessionUserId) router.replace(`/r/${slug}/t/${tableId}`);
  }, [sessionUserId, router, slug, tableId]);

  useEffect(() => {
    if (!slug || !tableId) return;
    Promise.all([
      checkoutService.getCheckoutSummary(slug, tableId),
      checkoutService.getExchangeRate(slug),
      restaurantService.getPublicInfo(slug),
    ]).then(([sum, rate, rest]) => {
      setSummary(sum);
      setExchangeRate(rate);
      setRestaurant(rest);
      setError(null);
    }).catch((e: any) => {
      setError(e.message || 'Error al cargar los datos de pago.');
    }).finally(() => setLoading(false));
  }, [slug, tableId]);

  // WebSocket for payment status
  const wsUrl = sessionUserId ? getComensalWebSocketUrl(tableId, sessionUserId) : '';
  useWebSocket({
    url: wsUrl,
    onMessage: (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === 'payment_verified') {
          setPaymentStatus('verified');
          triggerConfetti();
        } else if (msg.event === 'payment_rejected') {
          setPaymentStatus('rejected');
          setRejectionReason(msg.data?.reason || 'El mesero rechazó tu pago');
        }
      } catch {}
    },
  });

  const triggerConfetti = async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#6C63FF', '#FF6B35', '#22C55E', '#FFD700'] });
    } catch {}
  };

  const tipAmount = customTip ? parseFloat(customTip) : (summary ? summary.total_before_tip * selectedTip : 0);
  const totalUSD = summary ? summary.total_before_tip + tipAmount : 0;
  const totalVES = exchangeRate ? totalUSD * exchangeRate.usd_to_ves : 0;

  const handleSubmitPayment = async () => {
    if (!summary || !selectedMethod) return;
    setSubmitting(true);

    let referenceCode = '';
    let currency = 'USD';
    let amountLocal = 0;

    if (selectedMethod === 'pago_movil') {
      referenceCode = pagoMovilData.referencia;
      currency = 'VES';
      amountLocal = totalVES;
    } else if (selectedMethod === 'zelle') {
      referenceCode = zelleData.referencia;
    } else if (selectedMethod === 'efectivo_ves') {
      currency = 'VES';
      amountLocal = totalVES;
    }

    const paymentData: PaymentCreate = {
      amount_usd: totalUSD,
      currency,
      method: selectedMethod as PaymentCreate['method'],
      tip_amount: tipAmount,
      reference_code: referenceCode || undefined,
      exchange_rate: exchangeRate?.usd_to_ves,
      amount_local: amountLocal || undefined,
    };

    try {
      await checkoutService.submitPayment(slug, tableId, paymentData);
      setPaymentStatus('pending');
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error al procesar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableMethods = restaurant?.accepted_methods 
    ? PAYMENT_METHODS.filter(m => restaurant.accepted_methods?.includes(m.id))
    : PAYMENT_METHODS;

  if (loading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background-dark"><LoadingSpinner /></div>;
  }

  // Payment result screens
  if (paymentStatus === 'verified') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark px-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <div className="size-24 bg-success/20 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-success text-5xl">check_circle</span>
          </div>
        </motion.div>
        <h1 className="text-2xl font-black mb-2">¡Pago Aceptado! 🎉</h1>
        <p className="text-text-muted text-sm max-w-xs">Gracias por usar CheckNow. ¡Disfruta tu comida!</p>
        <p className="text-primary font-bold text-lg mt-4">${totalUSD.toFixed(2)} USD</p>
      </div>
    );
  }

  if (paymentStatus === 'rejected') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark px-6 text-center">
        <div className="size-24 bg-danger/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-danger text-5xl">cancel</span>
        </div>
        <h1 className="text-2xl font-black mb-2">Pago Rechazado</h1>
        <p className="text-text-muted text-sm max-w-xs mb-4">{rejectionReason}</p>
        <button onClick={() => { setPaymentStatus('idle'); setSubmitting(false); }}
          className="bg-primary text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-primary/30">
          Intentar de Nuevo
        </button>
      </div>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark px-6 text-center">
        <div className="relative size-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
          <div className="relative size-24 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl animate-pulse">hourglass_top</span>
          </div>
        </div>
        <h1 className="text-2xl font-black mb-2">Pago Enviado</h1>
        <p className="text-text-muted text-sm max-w-xs">Esperando confirmación del mesero...</p>
        <p className="text-primary font-bold text-lg mt-4">${totalUSD.toFixed(2)} USD</p>
      </div>
    );
  }

  return (
    <div className="bg-background-dark font-[Inter] text-white min-h-[100dvh] flex flex-col pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-5 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Link href={`/r/${slug}/t/${tableId}/cart`} className="size-10 rounded-xl bg-surface flex items-center justify-center">
            <span className="material-symbols-outlined text-text-muted">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Checkout</h1>
            <p className="text-xs text-text-muted">Pago de {alias || 'tu cuenta'}</p>
          </div>
        </div>
      </header>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-5 mt-4 p-4 rounded-2xl bg-danger/20 border border-danger/30 flex items-center justify-between"
          >
            <p className="text-danger font-bold text-sm text-left flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-danger opacity-70 hover:opacity-100 shrink-0">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 px-5 py-4 max-w-2xl mx-auto w-full space-y-6">
        {/* Summary card */}
        {summary && (
          <div className="p-5 rounded-2xl bg-surface space-y-3">
            <h2 className="font-bold text-sm text-text-muted uppercase tracking-wider">Desglose</h2>
            <div className="flex justify-between text-sm"><span className="text-text-muted">Subtotal</span><span className="font-bold">${summary.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-text-muted">IVA (16%)</span><span className="font-bold">${summary.tax.toFixed(2)}</span></div>
            {summary.service_charge > 0 && (
              <div className="flex justify-between text-sm"><span className="text-text-muted">Servicio</span><span className="font-bold">${summary.service_charge.toFixed(2)}</span></div>
            )}
            <div className="border-t border-neutral-border pt-3 flex justify-between"><span className="text-text-muted">Total antes de propina</span><span className="font-black text-lg">${summary.total_before_tip.toFixed(2)}</span></div>
          </div>
        )}

        {/* Tip selector */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-text-muted uppercase tracking-wider">Propina</h2>
          <div className="grid grid-cols-4 gap-2">
            {TIP_OPTIONS.map(opt => (
              <button key={opt.value}
                onClick={() => { setSelectedTip(opt.value); setCustomTip(''); }}
                className={`py-3 rounded-2xl font-bold text-sm transition-all ${
                  selectedTip === opt.value && !customTip ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface text-text-muted hover:bg-surface-2'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">$</span>
            <input type="number" value={customTip} onChange={(e) => { setCustomTip(e.target.value); setSelectedTip(-1); }}
              placeholder="Monto personalizado" className="w-full pl-8 pr-4 h-12 bg-surface border border-neutral-border rounded-2xl text-white placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
          </div>
        </div>

        {/* Exchange rate card */}
        {exchangeRate && (
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">currency_exchange</span>
            <div>
              <p className="text-sm font-bold">Tasa BCV del día</p>
              <p className="text-xs text-text-muted">1 USD = {exchangeRate.usd_to_ves.toFixed(2)} VES</p>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="p-5 rounded-2xl bg-surface space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Total USD</span>
            <span className="text-2xl font-black text-primary">${totalUSD.toFixed(2)}</span>
          </div>
          {exchangeRate && (
            <div className="flex justify-between items-center">
              <span className="text-text-muted text-sm">Total VES</span>
              <span className="text-lg font-bold text-text-muted">Bs. {totalVES.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-text-muted uppercase tracking-wider">Método de Pago</h2>
          <div className="grid grid-cols-1 gap-2">
            {availableMethods.map(m => (
              <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                  selectedMethod === m.id ? 'bg-primary/20 border border-primary/30' : 'bg-surface hover:bg-surface-2'
                }`}>
                <span className={`material-symbols-outlined ${m.color}`}>{m.icon}</span>
                <span className="font-semibold text-sm">{m.label}</span>
                {selectedMethod === m.id && <span className="ml-auto material-symbols-outlined text-primary text-lg">check_circle</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Payment form fields */}
        <AnimatePresence mode="wait">
          {selectedMethod === 'pago_movil' && (
            <motion.div key="pm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 p-5 rounded-2xl bg-surface">
              <h3 className="font-bold text-sm">Datos Pago Móvil</h3>
              <select value={pagoMovilData.banco} onChange={e => setPagoMovilData(d => ({ ...d, banco: e.target.value }))}
                className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Selecciona tu banco</option>
                {VENEZUELAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <input value={pagoMovilData.telefono} onChange={e => setPagoMovilData(d => ({ ...d, telefono: e.target.value }))}
                placeholder="Teléfono (04XX-XXXXXXX)" className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={pagoMovilData.cedula} onChange={e => setPagoMovilData(d => ({ ...d, cedula: e.target.value }))}
                placeholder="Cédula" className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={pagoMovilData.referencia} onChange={e => setPagoMovilData(d => ({ ...d, referencia: e.target.value }))}
                placeholder="# de Referencia *" className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" />
            </motion.div>
          )}
          {selectedMethod === 'zelle' && (
            <motion.div key="zl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 p-5 rounded-2xl bg-surface">
              <h3 className="font-bold text-sm">Datos Zelle</h3>
              <input value={zelleData.email} onChange={e => setZelleData(d => ({ ...d, email: e.target.value }))}
                placeholder="Email o teléfono Zelle" className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={zelleData.referencia} onChange={e => setZelleData(d => ({ ...d, referencia: e.target.value }))}
                placeholder="# de Referencia *" className="w-full h-12 bg-surface-2 border border-neutral-border rounded-xl px-4 text-white text-sm placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Submit button */}
      <div className="px-5 pb-6 max-w-2xl mx-auto w-full">
        <button onClick={handleSubmitPayment} disabled={!selectedMethod || submitting}
          className="w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95">
          {submitting ? 'Enviando...' : `Enviar Comprobante — $${totalUSD.toFixed(2)}`}
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </div>
    </div>
  );
}
