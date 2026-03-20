'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthRole = 'owner' | 'manager' | 'staff' | 'superadmin' | null;

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  restaurantId: string | null;
  slug: string | null;
  role: AuthRole;
  staffName: string | null;
  staffId: string | null;
  ownerEmail: string | null;
}

interface AuthActions {
  setOwnerAuth: (data: {
    access_token: string;
    refresh_token: string;
    restaurant_id: string;
    slug: string;
    email?: string;
  }) => void;
  setStaffAuth: (data: {
    access_token: string;
    staff_id: string;
    name: string;
    role: string;
    slug: string;
  }) => void;
  setSuperAdminAuth: (data: {
    access_token: string;
  }) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  restaurantId: null,
  slug: null,
  role: null,
  staffName: null,
  staffId: null,
  ownerEmail: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setOwnerAuth: (data) =>
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          restaurantId: data.restaurant_id,
          slug: data.slug,
          role: 'owner',
          ownerEmail: data.email || null,
          staffName: null,
          staffId: null,
        }),

      setStaffAuth: (data) =>
        set({
          accessToken: data.access_token,
          slug: data.slug,
          role: data.role as AuthRole,
          staffName: data.name,
          staffId: data.staff_id,
          refreshToken: null,
          restaurantId: null,
          ownerEmail: null,
        }),

      setSuperAdminAuth: (data) =>
        set({
          accessToken: data.access_token,
          role: 'superadmin',
          refreshToken: null,
          restaurantId: null,
          slug: null,
          staffName: null,
          staffId: null,
          ownerEmail: null,
        }),

      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        })),

      logout: () => set(initialState),

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'checknow-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        restaurantId: state.restaurantId,
        slug: state.slug,
        role: state.role,
        staffName: state.staffName,
        staffId: state.staffId,
        ownerEmail: state.ownerEmail,
      }),
    }
  )
);
