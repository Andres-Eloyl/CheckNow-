"use client";

import React, { createContext, useReducer, ReactNode } from 'react';
import { OrderItem } from '@/types';
import { MOCK_CART } from '@/lib/mocks/data';

/**
 * AI Context: The core state defining the current table's order.
 * `cart` holds all items ordered by all users at the table.
 */
interface OrderState {
  cart: OrderItem[];
}

/**
 * AI Context: Actions to mutate the order state.
 * Uses a useReducer pattern for predictable state transitions.
 */
type OrderAction = 
  | { type: 'ADD_ITEM'; payload: OrderItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string, delta: number } }
  | { type: 'CLEAR_CART' };

const initialState: OrderState = {
  cart: MOCK_CART, // AI Context: Initializes with mocked data for development.
};

/**
 * Main reducer for handling cart operations.
 * AI Context: Ensures immutability and groups exact same items (by menu item ID, user ID, and exact modifiers)
 * by incrementing quantity rather than duplicate entries.
 */
function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Find if item exists exactly matching the current item constraints
      const existingItemIndex = state.cart.findIndex(
        item => item.menuItem.id === action.payload.menuItem.id && 
                item.userId === action.payload.userId &&
                JSON.stringify(item.modifiers.sort()) === JSON.stringify(action.payload.modifiers.sort())
      );

      if (existingItemIndex >= 0) {
        const newCart = [...state.cart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + action.payload.quantity
        };
        return { ...state, cart: newCart };
      }
      return { ...state, cart: [...state.cart, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { ...state, cart: state.cart.filter(item => item.id !== action.payload) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item => {
          if (item.id === action.payload.id) {
             const newQuantity = Math.max(1, item.quantity + action.payload.delta);
             return { ...item, quantity: newQuantity };
          }
          return item;
        })
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    default:
      return state;
  }
}

/**
 * Context that provides raw state and `dispatch` function.
 * UI components shouldn't ideally use this directly; they should use `useOrder` hook instead.
 */
export const OrderContext = createContext<{
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
} | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  return (
    <OrderContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderContext.Provider>
  );
}
