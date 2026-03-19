"use client";

import { useContext, useCallback } from 'react';
import { OrderContext } from '@/context/OrderContext';
import { OrderItem } from '@/types';

/**
 * AI Context: Custom hook to interact with the global `OrderContext`.
 * Exposes methods to add/remove/update items and computed derived states
 * such as the local user's cart vs the table's total cart.
 *
 * @returns Object with state arrays, derived totals, and dispatcher functions.
 * @throws {Error} if used outside of `OrderProvider`.
 */
export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }

  const { state, dispatch } = context;

  /** Adds an item to the global cart. Handles incrementing quantity if exact item matched. */
  const addItem = useCallback((item: OrderItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, [dispatch]);

  /** Removes a specific item entry by its unique instance ID. */
  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, [dispatch]);

  /** Updates the quantity of a specific item entry. Delta can be positive or negative. */
  const updateQuantity = useCallback((id: string, delta: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, delta } });
  }, [dispatch]);
  
  /** Entirely clears the cart. Useful for post-checkout cleanup. */
  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, [dispatch]);

  // AI Context: Derived State. Currently mocks '1' as the active user ID.
  const activeUserId = '1';
  
  /** Filtered cart showing only the items added by the current session user. */
  const myCart = state.cart.filter(item => item.userId === activeUserId);
  /** Monetary total of the items from the current session user. */
  const myTotal = myCart.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
  /** Monetary total of all items in the global table cart. */
  const tableTotal = state.cart.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
  /** Total count of item units globally (not just distinct items). */
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
