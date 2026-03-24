/**
 * CheckNow! — Cross-Sell Service
 * Aligned with backend schemas/cross_sell.py
 */

import { api } from './client';

// ── Matches backend CrossSellRuleResponse ──

export interface CrossSellRule {
  id: string;
  trigger_item_id: string;
  trigger_item_name?: string;
  suggested_item_id: string;
  suggested_item_name?: string;
  priority: number;
  message?: string;
  discount_pct: number;
  is_active: boolean;
}

// ── Matches backend CrossSellRuleCreate ──

export interface CrossSellRuleCreate {
  trigger_item_id: string;
  suggested_item_id: string;
  priority?: number;
  message?: string;
  discount_pct?: number;
}

// ── Matches backend CrossSellRuleUpdate ──

export interface CrossSellRuleUpdate {
  priority?: number;
  message?: string;
  discount_pct?: number;
  is_active?: boolean;
}

// ── Matches backend SuggestionItem ──

export interface CrossSellSuggestion {
  item_id: string;
  name: string;
  description?: string;
  price_usd: number;
  image_url?: string;
  message?: string;
  discount_pct: number;
  discounted_price?: number;
}

interface SuggestionsResponse {
  trigger_item_id: string;
  trigger_item_name: string;
  suggestions: CrossSellSuggestion[];
}

// ── Service ──

export const crossSellService = {
  async getRules(slug: string): Promise<CrossSellRule[]> {
    return api.get<CrossSellRule[]>(`/api/${slug}/cross-sell/rules`, { staffAuth: true });
  },

  async createRule(slug: string, data: CrossSellRuleCreate): Promise<CrossSellRule> {
    return api.post<CrossSellRule>(`/api/${slug}/cross-sell/rules`, data, { staffAuth: true });
  },

  async updateRule(slug: string, ruleId: string, data: CrossSellRuleUpdate): Promise<CrossSellRule> {
    return api.put<CrossSellRule>(`/api/${slug}/cross-sell/rules/${ruleId}`, data, { staffAuth: true });
  },

  async deleteRule(slug: string, ruleId: string): Promise<void> {
    return api.delete(`/api/${slug}/cross-sell/rules/${ruleId}`, { staffAuth: true });
  },

  async getSuggestions(slug: string, itemId: string): Promise<CrossSellSuggestion[]> {
    const res = await api.get<SuggestionsResponse>(`/api/${slug}/cross-sell/suggestions?item_id=${itemId}`);
    return res.suggestions;
  },
};
