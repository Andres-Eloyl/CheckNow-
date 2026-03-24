/**
 * CheckNow! — Subscription Service
 */

import { api } from './client';

export interface SubscriptionStatus {
  plan_name: string;
  is_trial: boolean;
  trial_days_remaining?: number;
  expires_at?: string;
  tables_used: number;
  tables_max: number;
  staff_used: number;
  staff_max: number;
  analytics_enabled: boolean;
  cross_sell_enabled: boolean;
  loyalty_enabled: boolean;
}

export interface PlanInfo {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  max_tables: number;
  max_staff: number;
  analytics: boolean;
  cross_sell: boolean;
  loyalty: boolean;
  commission_rate: number;
}

export const subscriptionService = {
  async getStatus(slug: string): Promise<SubscriptionStatus> {
    return api.get<SubscriptionStatus>(`/api/${slug}/subscription/status`, { staffAuth: true });
  },

  async getPlans(slug: string): Promise<PlanInfo[]> {
    return api.get<PlanInfo[]>(`/api/${slug}/subscription/plans`, { staffAuth: true });
  },
};
