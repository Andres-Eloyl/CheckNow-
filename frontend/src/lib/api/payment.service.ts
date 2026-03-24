/**
 * CheckNow! — Payment Verification Service
 * Used by staff to verify or reject pending payments.
 */

import { api } from './client';
import type { PaymentResponse, PaymentReject } from '@/types/api.types';

export const paymentService = {
  async getPayments(slug: string): Promise<PaymentResponse[]> {
    return api.get<PaymentResponse[]>(`/api/${slug}/payments`, { staffAuth: true });
  },

  async verifyPayment(slug: string, paymentId: string): Promise<PaymentResponse> {
    return api.post<PaymentResponse>(`/api/${slug}/payments/${paymentId}/verify`, undefined, { staffAuth: true });
  },

  async rejectPayment(slug: string, paymentId: string, data: PaymentReject): Promise<PaymentResponse> {
    return api.post<PaymentResponse>(`/api/${slug}/payments/${paymentId}/reject`, data, { staffAuth: true });
  },
};
