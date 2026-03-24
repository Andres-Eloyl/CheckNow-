/**
 * CheckNow! — SuperAdmin Service
 * Aligned with backend schemas/admin.py
 */

import { api } from './client';

// ── Matches backend RestaurantAdminView ──

export interface AdminRestaurant {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  is_active: boolean;
  plan_name?: string;
  subscription_ends?: string;
  trial_ends?: string;
  tables_count: number;
  staff_count: number;
  created_at: string;
}

interface RestaurantListResponse {
  total: number;
  restaurants: AdminRestaurant[];
}

// ── Matches backend PlanResponse ──

export interface AdminPlan {
  id: string;
  name: string;
  price_monthly: number | null;
  price_yearly: number | null;
  max_tables: number;
  max_staff_users: number;
  analytics_enabled: boolean;
  cross_sell_enabled: boolean;
  loyalty_enabled: boolean;
  commission_rate: number;
  restaurant_count?: number;
}

// ── Matches backend PlanCreate ──

export interface AdminPlanCreate {
  name: string;
  price_monthly?: number;
  price_yearly?: number;
  max_tables?: number;
  max_staff_users?: number;
  analytics_enabled?: boolean;
  cross_sell_enabled?: boolean;
  loyalty_enabled?: boolean;
  commission_rate?: number;
}

export interface AssignPlanRequest {
  plan_id: string;
  period_months: number;
  amount: number;
  payment_ref: string;
}

export const adminService = {
  async login(email: string, password: string): Promise<{ access_token: string }> {
    return api.post('/api/admin/login', { email, password });
  },

  async getRestaurants(): Promise<AdminRestaurant[]> {
    const res = await api.get<RestaurantListResponse>('/api/admin/restaurants', { staffAuth: true });
    return res.restaurants;
  },

  async suspendRestaurant(id: string): Promise<void> {
    return api.patch(`/api/admin/restaurants/${id}/suspend`, undefined, { staffAuth: true });
  },

  async activateRestaurant(id: string): Promise<void> {
    return api.patch(`/api/admin/restaurants/${id}/activate`, undefined, { staffAuth: true });
  },

  async assignPlan(restaurantId: string, data: AssignPlanRequest): Promise<void> {
    return api.post(`/api/admin/restaurants/${restaurantId}/assign-plan`, data, { staffAuth: true });
  },

  async getPlans(): Promise<AdminPlan[]> {
    return api.get<AdminPlan[]>('/api/admin/plans', { staffAuth: true });
  },

  async createPlan(data: AdminPlanCreate): Promise<AdminPlan> {
    return api.post<AdminPlan>('/api/admin/plans', data, { staffAuth: true });
  },

  async updatePlan(id: string, data: Partial<AdminPlanCreate>): Promise<AdminPlan> {
    return api.put<AdminPlan>(`/api/admin/plans/${id}`, data, { staffAuth: true });
  },

  async deletePlan(id: string): Promise<void> {
    return api.delete(`/api/admin/plans/${id}`, { staffAuth: true });
  },
};
