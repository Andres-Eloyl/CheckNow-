"use client";

import React, { createContext, useReducer, ReactNode } from 'react';
import { OrderItem } from '@/types';
import { MOCK_CART } from '@/lib/mocks/data';

interface OrderState {
  cart: OrderItem[];
}

type OrderAction = 
  | { type: 'ADD_ITEM'; payload: OrderItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string, delta: number } }
  | { type: 'CLEAR_CART' };

const initialState: OrderState = {
  cart: MOCK_CART, // Se inicia con el backend mockeado temporalmente
};

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Buscar si el item ya existe con los mismos modificadores
      const existingItemIndex = state.cart.findIndex(
        item => item.menuItem.id === action.payload.menuItem.id && 
                item.userId === action.payload.userId &&
                JSON.stringify(item.modifiers.sort()) === JSON.stringify(action.payload.modifiers.sort())
      );

      if (existingItemIndex >= 0) {
        // Usa inmutabilidad con spread operator (Evita el anti-patrón Mutación)
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
