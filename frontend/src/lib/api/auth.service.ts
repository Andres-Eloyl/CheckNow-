/**
 * CheckNow! — Auth Service
 * Handles restaurant and staff authentication.
 */

import { api, setStaffAuth } from './client';
import type {
  StaffLoginRequest,
  StaffTokenResponse,
  RestaurantLoginRequest,
  TokenResponse,
  RestaurantRegisterRequest,
  RefreshTokenRequest,
} from '@/types/api.types';

export const authService = {
  /** Register a new restaurant */
  async registerRestaurant(data: RestaurantRegisterRequest): Promise<TokenResponse> {
    return api.post<TokenResponse>('/api/auth/register', data);
  },

  /** Login as restaurant owner */
  async loginRestaurant(data: RestaurantLoginRequest): Promise<TokenResponse> {
    return api.post<TokenResponse>('/api/auth/login', data);
  },

  /** Refresh access token */
  async refreshToken(data: RefreshTokenRequest): Promise<TokenResponse> {
    return api.post<TokenResponse>('/api/auth/refresh', data);
  },

  /** Login as staff member (PIN-based) */
  async loginStaff(slug: string, data: StaffLoginRequest): Promise<StaffTokenResponse> {
    const response = await api.post<StaffTokenResponse>(`/api/${slug}/staff/login`, data);
    
    // Persist tokens after successful login
    setStaffAuth({
      access_token: response.access_token,
      staff_id: response.staff_id,
      name: response.name,
      role: response.role,
      slug,
    });

    return response;
  },
};
