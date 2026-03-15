"use client";

import { useContext, useCallback } from 'react';
import { OrderContext } from '@/context/OrderContext';
import { OrderItem } from '@/types';

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }

  const { state, dispatch } = context;

  const addItem = useCallback((item: OrderItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, [dispatch]);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, [dispatch]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, delta } });
  }, [dispatch]);
  
  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, [dispatch]);

  // Derived state (Simulando que el UserId = '1' es el usuario local)
  const activeUserId = '1';
  const myCart = state.cart.filter(item => item.userId === activeUserId);
  const myTotal = myCart.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
  const tableTotal = state.cart.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
  const globalCartCount = state.cart.reduce((acc, item) => acc + item.quantity, 0);

  return {
    cart: state.cart,
    myCart,
    myTotal,
    tableTotal,
    globalCartCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };
}
