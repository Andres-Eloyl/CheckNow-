"use client";

import { useState, useEffect, useCallback } from 'react';
import { menuService } from '@/lib/api/menu.service';
import type { MenuResponse, MenuCategoryFull, MenuItemResponse } from '@/types/api.types';

/**
 * Custom hook to fetch and manage the restaurant menu.
 * Provides the full categorized menu, loading, error states, and a refetch function.
 *
 * @param slug - The restaurant slug to fetch the menu for.
 */
export function useMenu(slug: string | null) {
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    try {
      const data = await menuService.getMenu(slug);
      setMenu(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar el menú';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  /** Flat list of all categories. */
  const categories: MenuCategoryFull[] = menu?.categories || [];

  /** Flat list of all available items across all categories. */
  const allItems: MenuItemResponse[] = categories.flatMap(c => c.items.filter(i => i.is_available));

  /** Get items for a specific category. */
  const getItemsByCategory = useCallback(
    (categoryId: string): MenuItemResponse[] => {
      const category = categories.find(c => c.id === categoryId);
      return category?.items.filter(i => i.is_available) || [];
    },
    [categories]
  );

  /** Get a single item by ID. */
  const getItemById = useCallback(
    (itemId: string): MenuItemResponse | undefined => {
      return allItems.find(i => i.id === itemId);
    },
    [allItems]
  );

  return {
    menu,
    categories,
    allItems,
    loading,
    error,
    refetch: fetchMenu,
    getItemsByCategory,
    getItemById,
  };
}
