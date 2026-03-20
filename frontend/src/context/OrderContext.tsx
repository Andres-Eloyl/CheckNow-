"use client";

import React, { createContext, useReducer, useCallback, ReactNode } from 'react';
import { orderService } from '@/lib/api/order.service';
import type { OrderItemResponse, OrderItemCreate, OrderConfirmResponse } from '@/types/api.types';

/**
 * OrderState manages the collaborative cart for the current table session.
 * Data is sourced from the API and kept in sync via WebSocket events.
 */
interface OrderState {
  /** All order items for the current session (all users). */
  orders: OrderItemResponse[];
  /** Loading state for async operations. */
  loading: boolean;
  /** Error message from the last failed operation. */
  error: string | null;
}

type OrderAction =
  | { type: 'SET_ORDERS'; payload: OrderItemResponse[] }
  | { type: 'ADD_ORDER'; payload: OrderItemResponse }
  | { type: 'REMOVE_ORDER'; payload: string }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ORDERS' };

const initialState: OrderState = {
  orders: [],
  loading: false,
  error: null,
};

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload, loading: false, error: null };
    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };
    case 'REMOVE_ORDER':
      return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.payload.id
            ? { ...o, status: action.payload.status as OrderItemResponse['status'] }
            : o
        ),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ORDERS':
      return { ...state, orders: [], error: null };
    default:
      return state;
  }
}

interface OrderContextType {
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
  /** Fetch all orders for the session from the API. */
  fetchOrders: (slug: string, token: string) => Promise<void>;
  /** Add an item to the cart via the API. */
  addItem: (slug: string, token: string, data: OrderItemCreate) => Promise<OrderItemResponse>;
  /** Remove an item from the cart via the API. */
  removeItem: (slug: string, token: string, orderId: string) => Promise<void>;
  /** Confirm all pending orders (send to kitchen). */
  confirmOrders: (slug: string, token: string) => Promise<OrderConfirmResponse>;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  const fetchOrders = useCallback(async (slug: string, token: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const orders = await orderService.getSessionOrders(slug, token);
      dispatch({ type: 'SET_ORDERS', payload: orders });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar pedidos';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  }, []);

  const addItem = useCallback(async (slug: string, token: string, data: OrderItemCreate) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newOrder = await orderService.addItem(slug, token, data);
      dispatch({ type: 'ADD_ORDER', payload: newOrder });
      dispatch({ type: 'SET_LOADING', payload: false });
      return newOrder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al agregar item';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw err;
    }
  }, []);

  const removeItem = useCallback(async (slug: string, token: string, orderId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await orderService.removeItem(slug, token, orderId);
      dispatch({ type: 'REMOVE_ORDER', payload: orderId });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar item';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw err;
    }
  }, []);

  const confirmOrders = useCallback(async (slug: string, token: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await orderService.confirmOrders(slug, token);
      // Refresh orders after confirming to get updated statuses
      const orders = await orderService.getSessionOrders(slug, token);
      dispatch({ type: 'SET_ORDERS', payload: orders });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al confirmar pedidos';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw err;
    }
  }, []);

  return (
    <OrderContext.Provider value={{ state, dispatch, fetchOrders, addItem, removeItem, confirmOrders }}>
      {children}
    </OrderContext.Provider>
  );
}
