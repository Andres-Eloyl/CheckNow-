/**
 * CheckNow! — Menu Service
 * Fetches restaurant menu and handles CRUD for categories/items/modifiers.
 */

import { api } from './client';
import type {
  MenuResponse,
  CategoryCreate,
  CategoryUpdate,
  CategoryResponse,
  MenuItemCreate,
  MenuItemUpdate,
  MenuItemResponse,
  ModifierCreate,
  ModifierResponse,
} from '@/types/api.types';

export const menuService = {
  // ──────────────────────────────────────────────
  // Public (Comensal)
  // ──────────────────────────────────────────────

  /** Get the full menu for a restaurant (categories → items → modifiers). */
  async getMenu(slug: string): Promise<MenuResponse> {
    return api.get<MenuResponse>(`/api/${slug}/menu`);
  },

  // ──────────────────────────────────────────────
  // Categories (Staff)
  // ──────────────────────────────────────────────

  async createCategory(slug: string, data: CategoryCreate): Promise<CategoryResponse> {
    return api.post<CategoryResponse>(`/api/${slug}/menu/categories`, data, { staffAuth: true });
  },

  async updateCategory(slug: string, categoryId: string, data: CategoryUpdate): Promise<CategoryResponse> {
    return api.put<CategoryResponse>(`/api/${slug}/menu/categories/${categoryId}`, data, { staffAuth: true });
  },

  async deleteCategory(slug: string, categoryId: string): Promise<void> {
    return api.delete(`/api/${slug}/menu/categories/${categoryId}`, { staffAuth: true });
  },

  // ──────────────────────────────────────────────
  // Items (Staff)
  // ──────────────────────────────────────────────

  async createItem(slug: string, data: MenuItemCreate): Promise<MenuItemResponse> {
    return api.post<MenuItemResponse>(`/api/${slug}/menu/items`, data, { staffAuth: true });
  },

  async updateItem(slug: string, itemId: string, data: MenuItemUpdate): Promise<MenuItemResponse> {
    return api.put<MenuItemResponse>(`/api/${slug}/menu/items/${itemId}`, data, { staffAuth: true });
  },

  async deleteItem(slug: string, itemId: string): Promise<void> {
    return api.delete(`/api/${slug}/menu/items/${itemId}`, { staffAuth: true });
  },

  async updateItemStock(slug: string, itemId: string, stockCount: number): Promise<MenuItemResponse> {
    return api.patch<MenuItemResponse>(
      `/api/${slug}/menu/items/${itemId}/stock?stock_count=${stockCount}`,
      undefined,
      { staffAuth: true }
    );
  },

  // ──────────────────────────────────────────────
  // Modifiers (Staff)
  // ──────────────────────────────────────────────

  async createModifier(slug: string, itemId: string, data: ModifierCreate): Promise<ModifierResponse> {
    return api.post<ModifierResponse>(`/api/${slug}/menu/items/${itemId}/modifiers`, data, { staffAuth: true });
  },

  async deleteModifier(slug: string, modifierId: string): Promise<void> {
    return api.delete(`/api/${slug}/menu/modifiers/${modifierId}`, { staffAuth: true });
  },
};
