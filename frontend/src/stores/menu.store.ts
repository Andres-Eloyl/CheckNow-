'use client';

import { create } from 'zustand';
import type { MenuCategoryFull, MenuItemResponse } from '@/types/api.types';

interface MenuState {
  categories: MenuCategoryFull[];
  items: MenuItemResponse[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface MenuActions {
  setCategories: (categories: MenuCategoryFull[]) => void;
  setItems: (items: MenuItemResponse[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMenu: () => void;
  isCacheValid: () => boolean;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const useMenuStore = create<MenuState & MenuActions>()(
  (set, get) => ({
    categories: [],
    items: [],
    loading: false,
    error: null,
    lastFetched: null,

    setCategories: (categories) =>
      set({ categories, loading: false, error: null, lastFetched: Date.now() }),

    setItems: (items) => set({ items }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    clearMenu: () =>
      set({ categories: [], items: [], loading: false, error: null, lastFetched: null }),

    isCacheValid: () => {
      const { lastFetched } = get();
      if (!lastFetched) return false;
      return Date.now() - lastFetched < CACHE_DURATION_MS;
    },
  })
);
