/**
 * CheckNow! — Restaurant Config Service
 */

import { api } from './client';
import type { RestaurantConfigResponse, RestaurantConfigUpdate } from '@/types/api.types';

export const configService = {
  async getConfig(slug: string): Promise<RestaurantConfigResponse> {
    return api.get<RestaurantConfigResponse>(`/api/${slug}/config`, { staffAuth: true });
  },

  async updateConfig(slug: string, data: RestaurantConfigUpdate): Promise<RestaurantConfigResponse> {
    return api.put<RestaurantConfigResponse>(`/api/${slug}/config`, data, { staffAuth: true });
  },
};
