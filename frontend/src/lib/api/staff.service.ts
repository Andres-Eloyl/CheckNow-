import { api } from './client';
import type {
  StaffCreate,
  StaffUpdate,
  StaffResponse,
} from '@/types/api.types';

export const staffService = {
  /** Get all staff members (Owner/Manager only) */
  async getStaff(slug: string): Promise<StaffResponse[]> {
    return api.get<StaffResponse[]>(`/api/${slug}/staff`, { staffAuth: true });
  },

  /** Create a new staff member (Owner/Manager only) */
  async createStaff(slug: string, data: StaffCreate): Promise<StaffResponse> {
    return api.post<StaffResponse>(`/api/${slug}/staff`, data, { staffAuth: true });
  },

  /** Update an existing staff member (Owner/Manager only) */
  async updateStaff(slug: string, staffId: string, data: StaffUpdate): Promise<StaffResponse> {
    return api.put<StaffResponse>(`/api/${slug}/staff/${staffId}`, data, { staffAuth: true });
  },

  /** Deactivate a staff member (Owner/Manager only) */
  async deactivateStaff(slug: string, staffId: string): Promise<void> {
    return api.delete(`/api/${slug}/staff/${staffId}`, { staffAuth: true });
  },
};
