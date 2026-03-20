"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useOrder } from '@/hooks/useOrder';
import { useCheckout } from '@/hooks/useCheckout';
import { useConfig } from '@/context/ConfigContext';
import { useSession } from '@/context/SessionContext';
import { TipSelector } from '@/components/checkout/TipSelector';
import { PaymentMethodsAccordion, PaymentMethod } from '@/components/checkout/PaymentMethodsAccordion';
import { APP_CONSTANTS } from '@/lib/constants';
import type { PaymentMethod as ApiPaymentMethod } from '@/types/api.types';

export default function CheckoutPage() {
  const router = useRouter();
  const { tableTotal } = useOrder();
  const { config } = useConfig();
  const { clearSession } = useSession();
  const { summary, exchangeRate, fetchSummary, fetchExchangeRate, submitPayment, loading: checkoutLoading, error: checkoutError } = useCheckout();
  
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<PaymentMethod>('transfer');
  const [refNumber, setRefNumber] = useState('');
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');

  // Fetch checkout summary and exchange rate on mount
  useEffect(() => {
    fetchSummary();
    fetchExchangeRate();
  }, [fetchSummary, fetchExchangeRate]);

  // Use API summary or fallback to tableTotal
  const subtotal = summary?.total_before_tip ?? (tableTotal > 0 ? tableTotal : 0);

  // Set default tip when component loads
  useEffect(() => {
    if (config.tipsEnabled && config.tipPercentages.length > 0 && selectedTip === null) {
      setSelectedTip(config.tipPercentages[1] || config.tipPercentages[0]);
    } else if (!config.tipsEnabled) {
       setSelectedTip(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.tipsEnabled]);

  const tipAmount = (selectedTip !== null && config.tipsEnabled) ? subtotal * (selectedTip / 100) : 0; 
  const grandTotal = subtotal + tipAmount;

  const handlePay = async () => {
    setPaymentState('processing');
    try {
      const methodMap: Record<string, ApiPaymentMethod> = {
        transfer: 'pago_movil',
        terminal: 'tarjeta',
      };

      await submitPayment({
        amount_usd: grandTotal,
        currency: exchangeRate ? 'VES' : 'USD',
        method: methodMap[expandedPayment ?? 'transfer'] || 'pago_movil',
        tip_amount: tipAmount,
        reference_code: refNumber.trim() || undefined,
        exchange_rate: exchangeRate?.usd_to_ves,
        amount_local: exchangeRate ? grandTotal * exchangeRate.usd_to_ves : undefined,
      });

      setPaymentState('success');
    } catch {
      setPaymentState('idle');
    }
  };

  // ----- Success Screen -----
  if (paymentState === 'success') {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-white font-display">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="size-32 rounded-full bg-primary/20 flex items-center justify-center mb-8 border-4 border-primary/30"
        >
          {expandedPayment === 'transfer' ? (
            <span className="material-symbols-outlined text-[64px] text-primary">check_circle</span>
          ) : (
            <span className="material-symbols-outlined text-[64px] text-primary">credit_card</span>
          )}
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-black mb-4 tracking-tight"
        >
          {expandedPayment === 'transfer' ? '¡Pago Enviado!' : '¡Terminal en Camino!'}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 dark:text-slate-400 text-lg max-w-sm mb-12"
        >
          {expandedPayment === 'transfer' 
            ? 'Tu pago está pendiente de verificación por el staff. ¡Gracias!' 
            : 'Hemos bloqueado tus ítems. El mesero va en camino con la terminal.'}
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => {
            clearSession();
            router.push('/join');
          }}
          className="text-primary font-bold text-lg hover:underline decoration-2 underline-offset-4 outline-none focus-visible:ring-4 focus-visible:ring-primary/40 rounded-lg px-2"
        >
          Siguiente Cliente
        </motion.button>
      </main>
    );
  }

  // ----- Processing Screen -----
  if (paymentState === 'processing') {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-white font-display">
        <div className="relative size-24 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-white/10 border-t-primary"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="material-symbols-outlined text-3xl text-primary animate-pulse">lock</span>
          </div>
        </div>
        <h1 className="text-2xl font-black mb-2 tracking-tight">Procesando Pago</h1>
        <p className="text-slate-500 dark:text-slate-400">Por favor, no cierres esta pantalla.</p>
      </main>
    );
  }

  // ----- Checkout Screen -----
  return (
    <div className="bg-slate-50 dark:bg-[#0A0A0B] font-display text-slate-900 dark:text-slate-100 antialiased h-[100dvh]">
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        
        {/* TopAppBar */}
        <header className="flex items-center bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-md p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 justify-between max-w-2xl mx-auto w-full z-10 border-b border-slate-200/60 dark:border-white/5">
          <button onClick={() => router.back()} className="text-slate-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-slate-900 dark:text-white text-[18px] font-black leading-tight tracking-tight flex-1 text-center pr-10">Checkout Seguro</h1>
        </header>

        <main className="flex-1 overflow-y-auto pb-[180px] max-w-2xl mx-auto w-full">
          {/* Order Summary Preview */}
          <div className="px-5 py-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium">Subtotal de orden</p>
              <p className="text-slate-900 dark:text-white font-black text-[18px] tracking-tight">${subtotal.toFixed(2)}</p>
            </div>

            {/* Tax & service charge from API */}
            {summary && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-[13px]">Impuesto</p>
                  <p className="text-slate-500 text-[13px] font-semibold">+${summary.tax.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-[13px]">Servicio</p>
                  <p className="text-slate-500 text-[13px] font-semibold">+${summary.service_charge.toFixed(2)}</p>
                </div>
              </>
            )}

            <div className="h-px bg-slate-200 dark:bg-white/10 w-full mb-3"></div>
            {config.tipsEnabled && selectedTip !== null && selectedTip > 0 && (
              <div className="flex items-center justify-between text-[var(--color-primary)]">
                 <p className="text-[15px] font-bold">Propina ({selectedTip}%)</p>
                 <p className="font-bold">+${tipAmount.toFixed(2)}</p>
              </div>
            )}

            {/* Exchange rate display */}
            {exchangeRate && (
              <div className="mt-4 p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-blue-700 dark:text-blue-400">Tasa BCV</span>
                  <span className="text-[13px] font-bold text-blue-700 dark:text-blue-300">1 USD = {exchangeRate.usd_to_ves.toFixed(2)} Bs</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[13px] font-medium text-blue-700 dark:text-blue-400">Total en Bs</span>
                  <span className="text-[15px] font-black text-blue-700 dark:text-blue-300">Bs {(grandTotal * exchangeRate.usd_to_ves).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <TipSelector selectedTip={selectedTip} onSelectTip={setSelectedTip} />

          <PaymentMethodsAccordion 
            expandedPayment={expandedPayment} 
            setExpandedPayment={setExpandedPayment} 
            refNumber={refNumber} 
            setRefNumber={setRefNumber} 
            onTerminalRequest={handlePay} 
          />

          {/* Error display */}
          {checkoutError && (
            <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[13px] font-medium text-center">
              {checkoutError}
            </div>
          )}
        </main>

        {/* Bottom Action Bar */}
        <footer className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
          <div className="p-5 max-w-2xl mx-auto w-full pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            <div className="flex items-center justify-between mb-5 px-1">
              <span className="text-slate-500 dark:text-slate-400 text-[14px] font-medium uppercase tracking-wider">Total a Pagar</span>
              <span className="text-slate-900 dark:text-white text-[32px] font-black tracking-tighter leading-none">${grandTotal.toFixed(2)}</span>
            </div>
          <button 
            onClick={handlePay}
            disabled={(expandedPayment === 'transfer' && !refNumber.trim()) || checkoutLoading}
            className="w-full bg-primary hover:bg-primary/95 disabled:opacity-40 disabled:active:scale-100 text-white font-bold text-[18px] h-14 rounded-2xl shadow-[0_8px_24px_rgba(244,123,37,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          >
            <span className="material-symbols-outlined text-[20px]">
               {expandedPayment === 'transfer' ? 'verified' : 'point_of_sale'}
            </span>
            <span>{expandedPayment === 'transfer' ? 'Validar Transferencia' : 'Confirmar Terminal'}</span>
          </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
