/**
 * CheckNow! — Analytics Service
 * Endpoints for restaurant analytics dashboard.
 * Aligned with backend schemas/analytics.py
 */

import { api } from './client';

function getAuth() {
  return { staffAuth: true };
}

// ── Dashboard KPIs (matches backend DashboardSummary) ──

export interface DashboardKPIs {
  total_revenue_today: number;
  total_orders_today: number;
  avg_ticket_today: number;
  active_sessions: number;
  total_revenue_month: number;
  total_orders_month: number;
  avg_ticket_month: number;
  tips_collected_month: number;
}

// ── Sales by Day (matches backend SalesByDayItem) ──

export interface SalesByDay {
  date: string;
  total_usd: number;
  order_count: number;
  avg_ticket: number;
}

interface SalesByDayResponse {
  period_start: string;
  period_end: string;
  days: SalesByDay[];
  grand_total: number;
  grand_orders: number;
}

// ── Top Items (matches backend TopMenuItem) ──

export interface TopItem {
  menu_item_id: string;
  name: string;
  quantity_sold: number;
  revenue_usd: number;
}

interface TopItemsResponse {
  period_start: string;
  period_end: string;
  items: TopItem[];
}

// ── Peak Hours (matches backend PeakHourItem) ──

export interface PeakHour {
  hour: number;
  order_count: number;
  revenue_usd: number;
}

interface PeakHoursResponse {
  period_start: string;
  period_end: string;
  hours: PeakHour[];
  busiest_hour: number;
}

// ── Payment Methods (matches backend PaymentMethodStat) ──

export interface PaymentMethodStat {
  method: string;
  count: number;
  total_usd: number;
  percentage: number;
}

interface PaymentMethodsResponse {
  period_start: string;
  period_end: string;
  methods: PaymentMethodStat[];
}

// ── Service ──

export const analyticsService = {
  async getDashboardKPIs(slug: string): Promise<DashboardKPIs> {
    return api.get<DashboardKPIs>(`/api/${slug}/analytics/dashboard`, getAuth());
  },

  async getSalesByDay(slug: string, days = 30): Promise<SalesByDay[]> {
    const res = await api.get<SalesByDayResponse>(`/api/${slug}/analytics/sales-by-day?days=${days}`, getAuth());
    return res.days;
  },

  async getTopItems(slug: string, days = 30, limit = 10): Promise<TopItem[]> {
    const res = await api.get<TopItemsResponse>(`/api/${slug}/analytics/top-items?days=${days}&limit=${limit}`, getAuth());
    return res.items;
  },

  async getPeakHours(slug: string, days = 30): Promise<PeakHour[]> {
    const res = await api.get<PeakHoursResponse>(`/api/${slug}/analytics/peak-hours?days=${days}`, getAuth());
    return res.hours;
  },

  async getPaymentMethods(slug: string, days = 30): Promise<PaymentMethodStat[]> {
    const res = await api.get<PaymentMethodsResponse>(`/api/${slug}/analytics/payment-methods?days=${days}`, getAuth());
    return res.methods;
  },
};
