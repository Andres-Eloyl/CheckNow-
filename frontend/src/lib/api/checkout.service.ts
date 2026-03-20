/**
 * CheckNow! — Checkout Service
 * Handles checkout summaries, exchange rates, and payment processing.
 */

import { api } from './client';
import type {
  CheckoutSummary,
  PaymentCreate,
  PaymentResponse,
  PaymentReject,
  ExchangeRateResponse,
} from '@/types/api.types';

export const checkoutService = {
  /** Get exchange rate from BCV (public). */
  async getExchangeRate(slug: string): Promise<ExchangeRateResponse> {
    return api.get<ExchangeRateResponse>(`/api/${slug}/public/exchange-rate`);
  },

  /** Get the global BCV rate (no slug required). */
  async getBcvRate(): Promise<ExchangeRateResponse> {
    return api.get<ExchangeRateResponse>('/api/rates/bcv');
  },

  /** Get checkout summary for the current user. */
  async getCheckoutSummary(slug: string, token: string): Promise<CheckoutSummary> {
    return api.get<CheckoutSummary>(
      `/api/${slug}/sessions/${token}/checkout/summary`,
      { sessionAuth: true }
    );
  },

  /** Submit a payment for staff verification. */
  async submitPayment(slug: string, token: string, data: PaymentCreate): Promise<PaymentResponse> {
    return api.post<PaymentResponse>(
      `/api/${slug}/sessions/${token}/checkout/pay`,
      data,
      { sessionAuth: true }
    );
  },

  /** Verify a pending payment (Staff only). */
  async verifyPayment(slug: string, paymentId: string): Promise<PaymentResponse> {
    return api.post<PaymentResponse>(
      `/api/${slug}/payments/${paymentId}/verify`,
      undefined,
      { staffAuth: true }
    );
  },

  /** Reject a pending payment (Staff only). */
  async rejectPayment(slug: string, paymentId: string, data: PaymentReject): Promise<PaymentResponse> {
    return api.post<PaymentResponse>(
      `/api/${slug}/payments/${paymentId}/reject`,
      data,
      { staffAuth: true }
    );
  },
};
