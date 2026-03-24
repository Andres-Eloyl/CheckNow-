import { api } from './client';
import type { RestaurantPublic } from '@/types/api.types';

export const restaurantService = {
  /** Get public information for a restaurant */
  async getPublicInfo(slug: string): Promise<RestaurantPublic> {
    return api.get<RestaurantPublic>(`/api/restaurants/${slug}`);
  },
};
