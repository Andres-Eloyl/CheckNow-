import { api, API_BASE_URL } from './client';
import type {
  TableCreate,
  TableUpdate,
  TableResponse,
} from '@/types/api.types';

export const tablesService = {
  /** Get all tables for a restaurant */
  async getTables(slug: string): Promise<TableResponse[]> {
    return api.get<TableResponse[]>(`/api/${slug}/tables`, { requiresAuth: true });
  },

  /** Create a new table */
  async createTable(slug: string, data: TableCreate): Promise<TableResponse> {
    return api.post<TableResponse>(`/api/${slug}/tables`, data, { requiresAuth: true });
  },

  /** Update an existing table */
  async updateTable(slug: string, tableId: string, data: TableUpdate): Promise<TableResponse> {
    return api.put<TableResponse>(`/api/${slug}/tables/${tableId}`, data, { requiresAuth: true });
  },

  /** Delete a table */
  async deleteTable(slug: string, tableId: string): Promise<void> {
    return api.delete(`/api/${slug}/tables/${tableId}`, { requiresAuth: true });
  },

  /** Generate the QR API URL for a table (returns the image URL directly) */
  getTableQRUrl(slug: string, tableId: string): string {
    return `${API_BASE_URL()}/api/${slug}/tables/${tableId}/qr`;
  },
};
