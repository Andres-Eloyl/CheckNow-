/**
 * CheckNow! — Order Service
 * Handles the collaborative cart and order lifecycle.
 */

import { api } from './client';
import type {
  OrderItemCreate,
  OrderItemResponse,
  OrderConfirmResponse,
  OrderStatusUpdate,
} from '@/types/api.types';

export const orderService = {
  // ──────────────────────────────────────────────
  // Comensal Endpoints
  // ──────────────────────────────────────────────

  /** Add an item to the collaborative cart. */
  async addItem(slug: string, token: string, data: OrderItemCreate): Promise<OrderItemResponse> {
    return api.post<OrderItemResponse>(
      `/api/${slug}/sessions/${token}/orders`,
      data,
      { sessionAuth: true }
    );
  },

  /** Remove an item from the cart (only if status is PENDING). */
  async removeItem(slug: string, token: string, orderId: string): Promise<void> {
    return api.delete(`/api/${slug}/sessions/${token}/orders/${orderId}`, {
      sessionAuth: true,
    });
  },

  /** Get all orders for the current table session. */
  async getSessionOrders(slug: string, token: string): Promise<OrderItemResponse[]> {
    return api.get<OrderItemResponse[]>(`/api/${slug}/sessions/${token}/orders`);
  },

  /** Confirm all pending orders and send them to kitchen/bar. */
  async confirmOrders(slug: string, token: string): Promise<OrderConfirmResponse> {
    return api.post<OrderConfirmResponse>(
      `/api/${slug}/sessions/${token}/orders/confirm`,
      undefined,
      { sessionAuth: true }
    );
  },

  // ──────────────────────────────────────────────
  // Staff Endpoints
  // ──────────────────────────────────────────────

  /** Update order status (Staff only). */
  async updateOrderStatus(
    slug: string,
    orderId: string,
    data: OrderStatusUpdate
  ): Promise<OrderItemResponse> {
    return api.patch<OrderItemResponse>(
      `/api/${slug}/orders/${orderId}/status`,
      data,
      { staffAuth: true }
    );
  },
};
