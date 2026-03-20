"use client";

import { useContext, useCallback, useMemo } from 'react';
import { OrderContext } from '@/context/OrderContext';
import { useSession } from '@/context/SessionContext';
import type { OrderItemCreate, OrderConfirmResponse } from '@/types/api.types';

/**
 * Custom hook to interact with the global OrderContext.
 * Exposes methods to add/remove items, confirm orders, and computed derived states.
 * Automatically injects slug and session token from SessionContext.
 *
 * @returns Object with state, derived totals, and action functions.
 * @throws {Error} if used outside of OrderProvider or SessionProvider.
 */
export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }

  const { session, currentUser, slug, sessionToken } = useSession();
  const { state, fetchOrders, addItem, removeItem, confirmOrders } = context;

  /** Fetch all orders from the API. */
  const loadOrders = useCallback(async () => {
    if (!slug || !sessionToken) return;
    await fetchOrders(slug, sessionToken);
  }, [slug, sessionToken, fetchOrders]);

  /** Add an item to the cart via the API. */
  const addOrderItem = useCallback(async (data: OrderItemCreate) => {
    if (!slug || !sessionToken) throw new Error('No hay sesión activa');
    return addItem(slug, sessionToken, data);
  }, [slug, sessionToken, addItem]);

  /** Remove an item from the cart via the API. */
  const removeOrderItem = useCallback(async (orderId: string) => {
    if (!slug || !sessionToken) throw new Error('No hay sesión activa');
    return removeItem(slug, sessionToken, orderId);
  }, [slug, sessionToken, removeItem]);

  /** Confirm all pending orders (send to kitchen). */
  const confirmAllOrders = useCallback(async (): Promise<OrderConfirmResponse> => {
    if (!slug || !sessionToken) throw new Error('No hay sesión activa');
    return confirmOrders(slug, sessionToken);
  }, [slug, sessionToken, confirmOrders]);

  /** Active user ID from session. */
  const activeUserId = currentUser?.id || null;

  /** Derived: only the current user's orders. */
  const myOrders = useMemo(
    () => state.orders.filter(o => o.session_user_id === activeUserId),
    [state.orders, activeUserId]
  );

  /** Derived: monetary total of the current user's items. */
  const myTotal = useMemo(
    () => myOrders.reduce((acc, o) => acc + o.unit_price * o.quantity, 0),
    [myOrders]
  );

  /** Derived: monetary total of all items in the table. */
  const tableTotal = useMemo(
    () => state.orders.reduce((acc, o) => acc + o.unit_price * o.quantity, 0),
    [state.orders]
  );

  /** Derived: total count of item units globally. */
  const globalCartCount = useMemo(
    () => state.orders.reduce((acc, o) => acc + o.quantity, 0),
    [state.orders]
  );

  /** Derived: only pending items (not yet sent to kitchen). */
  const pendingOrders = useMemo(
    () => state.orders.filter(o => o.status === 'pending'),
    [state.orders]
  );

  return {
    orders: state.orders,
    myOrders,
    pendingOrders,
    myTotal,
    tableTotal,
    globalCartCount,
    loading: state.loading,
    error: state.error,
    activeUserId,
    loadOrders,
    addOrderItem,
    removeOrderItem,
    confirmAllOrders,
  };
}
