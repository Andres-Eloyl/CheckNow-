"use client";

import { useState, useCallback } from 'react';
import { checkoutService } from '@/lib/api/checkout.service';
import { useSession } from '@/context/SessionContext';
import type {
  CheckoutSummary,
  PaymentCreate,
  PaymentResponse,
  ExchangeRateResponse,
} from '@/types/api.types';

/**
 * Custom hook to manage the checkout flow.
 * Provides summary fetching, exchange rate, and payment submission.
 */
export function useCheckout() {
  const { slug, sessionToken } = useSession();
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch the checkout summary for the current user. */
  const fetchSummary = useCallback(async () => {
    if (!slug || !sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await checkoutService.getCheckoutSummary(slug, sessionToken);
      setSummary(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar resumen';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, sessionToken]);

  /** Fetch the current BCV exchange rate. */
  const fetchExchangeRate = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await checkoutService.getExchangeRate(slug);
      setExchangeRate(data);
    } catch (err) {
      // Non-blocking error: rate might not be available
      console.warn('Exchange rate not available:', err);
    }
  }, [slug]);

  /** Submit a payment for staff verification. */
  const submitPayment = useCallback(async (data: PaymentCreate): Promise<PaymentResponse> => {
    if (!slug || !sessionToken) throw new Error('No hay sesión activa');
    setLoading(true);
    setError(null);
    try {
      const result = await checkoutService.submitPayment(slug, sessionToken, data);
      setLoading(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar pago';
      setError(message);
      setLoading(false);
      throw err;
    }
  }, [slug, sessionToken]);

  return {
    summary,
    exchangeRate,
    loading,
    error,
    fetchSummary,
    fetchExchangeRate,
    submitPayment,
  };
}
