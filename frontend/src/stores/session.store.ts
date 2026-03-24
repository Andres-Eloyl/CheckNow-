'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SessionResponse, SessionUserResponse, OrderItemResponse } from '@/types/api.types';

interface SessionState {
  sessionToken: string | null;
  sessionUserId: string | null;
  alias: string | null;
  color: string | null;
  emoji: string | null;
  tableNumber: number | null;
  slug: string | null;
  session: SessionResponse | null;
  participants: SessionUserResponse[];
  orders: OrderItemResponse[];
}

interface SessionActions {
  setSession: (data: {
    session: SessionResponse;
    user: SessionUserResponse;
    slug: string;
    token: string;
  }) => void;
  updateSession: (session: SessionResponse) => void;
  setOrders: (orders: OrderItemResponse[]) => void;
  addOrder: (order: OrderItemResponse) => void;
  removeOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  setParticipants: (participants: SessionUserResponse[]) => void;
  clearSession: () => void;
}

const initialState: SessionState = {
  sessionToken: null,
  sessionUserId: null,
  alias: null,
  color: null,
  emoji: null,
  tableNumber: null,
  slug: null,
  session: null,
  participants: [],
  orders: [],
};

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      ...initialState,

      setSession: (data) =>
        set({
          session: data.session,
          sessionToken: data.token,
          sessionUserId: data.user.id,
          alias: data.user.alias,
          color: data.user.color,
          emoji: data.user.emoji || null,
          tableNumber: data.session.table_number || null,
          slug: data.slug,
          participants: data.session.users,
        }),

      updateSession: (session) =>
        set({ session, participants: session.users }),

      setOrders: (orders) => set({ orders }),

      addOrder: (order) =>
        set((state) => ({ orders: [...state.orders, order] })),

      removeOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== orderId),
        })),

      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: status as OrderItemResponse['status'] } : o
          ),
        })),

      setParticipants: (participants) => set({ participants }),

      clearSession: () => set(initialState),
    }),
    {
      name: 'checknow-session',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    }
  )
);
