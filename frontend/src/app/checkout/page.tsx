"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useOrder } from '@/hooks/useOrder';
import { TipSelector } from '@/components/checkout/TipSelector';
import { PaymentMethodsAccordion, PaymentMethod } from '@/components/checkout/PaymentMethodsAccordion';
import { APP_CONSTANTS } from '@/lib/constants';

export default function CheckoutPage() {
  const router = useRouter();
  const { tableTotal, clearCart } = useOrder();
  
  // Note: For a fully integrated app we could read exactly how
  // the user opted to split. We default to TableTotal to not break the UI flow.
  const subtotal = tableTotal > 0 ? tableTotal : 42.50;

  const [selectedTip, setSelectedTip] = useState<number | null>(15);
  const [expandedPayment, setExpandedPayment] = useState<PaymentMethod>('transfer');
  const [refNumber, setRefNumber] = useState('');
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');

  const tipAmount = selectedTip !== null ? subtotal * (selectedTip / 100) : 0; 
  const grandTotal = subtotal + tipAmount;

  const handleValidateTransfer = () => {
    if (!refNumber) return;
    setPaymentState('processing');
    setTimeout(() => {
       setPaymentState('success')
    }, APP_CONSTANTS.PAYMENT_PROCESSING_MS); 
  };

  const handleTerminalRequest = () => {
    setPaymentState('processing');
    setExpandedPayment('terminal');
    setTimeout(() => {
       setPaymentState('success')
    }, APP_CONSTANTS.PAYMENT_PROCESSING_MS); 
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
          {expandedPayment === 'transfer' ? '¡Pago Confirmado!' : '¡Terminal en Camino!'}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 dark:text-slate-400 text-lg max-w-sm mb-12"
        >
          {expandedPayment === 'transfer' 
            ? 'Hemos recibido tu transferencia. Gracias por visitar CheckNow.' 
            : 'Hemos bloqueado tus ítems. El mesero va en camino con la terminal a la Mesa 4.'}
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => {
            clearCart();
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
        <h1 className="text-2xl font-black mb-2 tracking-tight">Procesando Seguro</h1>
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
            <div className="h-px bg-slate-200 dark:bg-white/10 w-full mb-3"></div>
            {selectedTip !== null && selectedTip > 0 && (
              <div className="flex items-center justify-between text-primary">
                 <p className="text-[15px] font-bold">Propina ({selectedTip}%)</p>
                 <p className="font-bold">+${tipAmount.toFixed(2)}</p>
              </div>
            )}
          </div>

          <TipSelector selectedTip={selectedTip} onSelectTip={setSelectedTip} />

          <PaymentMethodsAccordion 
            expandedPayment={expandedPayment} 
            setExpandedPayment={setExpandedPayment} 
            refNumber={refNumber} 
            setRefNumber={setRefNumber} 
            onTerminalRequest={handleTerminalRequest} 
          />
        </main>

        {/* Bottom Action Bar */}
        <footer className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
          <div className="p-5 max-w-2xl mx-auto w-full pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            <div className="flex items-center justify-between mb-5 px-1">
              <span className="text-slate-500 dark:text-slate-400 text-[14px] font-medium uppercase tracking-wider">Total a Pagar</span>
              <span className="text-slate-900 dark:text-white text-[32px] font-black tracking-tighter leading-none">${grandTotal.toFixed(2)}</span>
            </div>
          <button 
            onClick={expandedPayment === 'transfer' ? handleValidateTransfer : handleTerminalRequest}
            disabled={expandedPayment === 'transfer' && !refNumber.trim()}
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
