'use client';

import { create } from 'zustand';
import type { TableResponse, PaymentResponse, OrderItemResponse } from '@/types/api.types';

interface DashboardState {
  activeTables: TableResponse[];
  pendingPayments: PaymentResponse[];
  kitchenOrders: OrderItemResponse[];
  wsConnected: boolean;
  notifications: DashboardNotification[];
}

export interface DashboardNotification {
  id: string;
  type: 'new_order' | 'payment_pending' | 'item_sold_out' | 'info';
  title: string;
  message: string;
  tableNumber?: number;
  timestamp: string;
  read: boolean;
}

interface DashboardActions {
  setTables: (tables: TableResponse[]) => void;
  updateTableStatus: (tableId: string, status: TableResponse['status']) => void;
  setPendingPayments: (payments: PaymentResponse[]) => void;
  addPendingPayment: (payment: PaymentResponse) => void;
  removePayment: (paymentId: string) => void;
  setKitchenOrders: (orders: OrderItemResponse[]) => void;
  addKitchenOrder: (order: OrderItemResponse) => void;
  updateKitchenOrderStatus: (orderId: string, status: string) => void;
  setWsConnected: (connected: boolean) => void;
  addNotification: (notification: Omit<DashboardNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  (set) => ({
    activeTables: [],
    pendingPayments: [],
    kitchenOrders: [],
    wsConnected: false,
    notifications: [],

    setTables: (tables) => set({ activeTables: tables }),

    updateTableStatus: (tableId, status) =>
      set((state) => ({
        activeTables: state.activeTables.map((t) =>
          t.id === tableId ? { ...t, status } : t
        ),
      })),

    setPendingPayments: (payments) => set({ pendingPayments: payments }),

    addPendingPayment: (payment) =>
      set((state) => ({
        pendingPayments: [payment, ...state.pendingPayments],
      })),

    removePayment: (paymentId) =>
      set((state) => ({
        pendingPayments: state.pendingPayments.filter((p) => p.id !== paymentId),
      })),

    setKitchenOrders: (orders) => set({ kitchenOrders: orders }),

    addKitchenOrder: (order) =>
      set((state) => ({
        kitchenOrders: [order, ...state.kitchenOrders],
      })),

    updateKitchenOrderStatus: (orderId, status) =>
      set((state) => ({
        kitchenOrders: state.kitchenOrders.map((o) =>
          o.id === orderId ? { ...o, status: status as OrderItemResponse['status'] } : o
        ),
      })),

    setWsConnected: (connected) => set({ wsConnected: connected }),

    addNotification: (notification) =>
      set((state) => ({
        notifications: [
          {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...state.notifications,
        ].slice(0, 50),
      })),

    markNotificationRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),

    clearNotifications: () => set({ notifications: [] }),
  })
);
