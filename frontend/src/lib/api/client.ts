/**
 * CheckNow! — HTTP API Client
 * Central fetch wrapper with token management, error handling, and base URL config.
 */

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const INTERNAL_BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return (INTERNAL_BACKEND_URL.endsWith('/') ? INTERNAL_BACKEND_URL.slice(0, -1) : INTERNAL_BACKEND_URL);
  }
  // Use relative URL in the browser - handled by Next.js proxy in next.config.ts
  return '';
};

// ──────────────────────────────────────────────
// Token Management
// ──────────────────────────────────────────────

/** Keys used to store tokens in localStorage. */
const TOKEN_KEYS = {
  STAFF_TOKEN: 'checknow_staff_token',
  STAFF_NAME: 'checknow_staff_name',
  STAFF_ROLE: 'checknow_staff_role',
  STAFF_ID: 'checknow_staff_id',
  SESSION_USER_ID: 'checknow_session_user_id',
  SESSION_TOKEN: 'checknow_session_token',
  RESTAURANT_SLUG: 'checknow_slug',
} as const;

function getStoredValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function setStoredValue(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

function removeStoredValue(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export function getStaffToken(): string | null {
  return getStoredValue(TOKEN_KEYS.STAFF_TOKEN);
}

export function getSessionUserId(): string | null {
  return getStoredValue(TOKEN_KEYS.SESSION_USER_ID);
}

export function getSessionToken(): string | null {
  return getStoredValue(TOKEN_KEYS.SESSION_TOKEN);
}

export function getSlug(): string | null {
  return getStoredValue(TOKEN_KEYS.RESTAURANT_SLUG);
}

export function setStaffAuth(data: {
  access_token: string;
  staff_id: string;
  name: string;
  role: string;
  slug: string;
}): void {
  setStoredValue(TOKEN_KEYS.STAFF_TOKEN, data.access_token);
  setStoredValue(TOKEN_KEYS.STAFF_ID, data.staff_id);
  setStoredValue(TOKEN_KEYS.STAFF_NAME, data.name);
  setStoredValue(TOKEN_KEYS.STAFF_ROLE, data.role);
  setStoredValue(TOKEN_KEYS.RESTAURANT_SLUG, data.slug);
}

export function setSessionAuth(data: {
  session_user_id: string;
  session_token: string;
  slug: string;
}): void {
  setStoredValue(TOKEN_KEYS.SESSION_USER_ID, data.session_user_id);
  setStoredValue(TOKEN_KEYS.SESSION_TOKEN, data.session_token);
  setStoredValue(TOKEN_KEYS.RESTAURANT_SLUG, data.slug);
}

export function clearStaffAuth(): void {
  removeStoredValue(TOKEN_KEYS.STAFF_TOKEN);
  removeStoredValue(TOKEN_KEYS.STAFF_ID);
  removeStoredValue(TOKEN_KEYS.STAFF_NAME);
  removeStoredValue(TOKEN_KEYS.STAFF_ROLE);
}

export function clearSessionAuth(): void {
  removeStoredValue(TOKEN_KEYS.SESSION_USER_ID);
  removeStoredValue(TOKEN_KEYS.SESSION_TOKEN);
}

// ──────────────────────────────────────────────
// Error Handling
// ──────────────────────────────────────────────

import { useAuthStore } from '@/stores/auth.store';

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public url?: string,
    public method?: string,
    public originalError?: unknown
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

// ──────────────────────────────────────────────
// Core Fetch Wrapper
// ──────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** If true, include the JWT Bearer token. */
  requiresAuth?: boolean;
  /** Legacy support: mapped to requiresAuth */
  staffAuth?: boolean;
  /** If true, include X-Session-User-Id header. */
  sessionAuth?: boolean;
  /** Internal retry tracking */
  retryCount?: number;
}

/**
 * Extracts the token from Zustand's persisted state.
 */
function getZustandToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const authStorage = localStorage.getItem('checknow-auth');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.accessToken || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Central API fetch wrapper.
 * Handles JSON serialization, auth headers, and error normalization.
 */
async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, staffAuth = false, requiresAuth = false, sessionAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  const needsAuth = requiresAuth || staffAuth;

  if (needsAuth) {
    // Try Zustand store first, fallback to legacy staff token
    const token = getZustandToken() || getStaffToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Session user header
  if (sessionAuth) {
    const sessionUserId = getSessionUserId();
    if (sessionUserId) {
      headers['X-Session-User-Id'] = sessionUserId;
    }
  }

  const url = `${getApiBaseUrl()}${endpoint}`;

  try {
    let response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // Automatic Token Refresh
    if (response.status === 401 && needsAuth && !endpoint.includes('/refresh') && !endpoint.includes('/login')) {
      const state = useAuthStore.getState();
      const refreshToken = state.refreshToken;
      
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            // Update store
            state.setTokens(refreshData.access_token, refreshData.refresh_token);
            // Update headers and retry request
            headers['Authorization'] = `Bearer ${refreshData.access_token}`;
            response = await fetch(url, {
              ...fetchOptions,
              headers,
              body: body ? JSON.stringify(body) : undefined,
            });
          } else {
            state.logout(); // Refresh token failed/expired
          }
        } catch {
          // Network error during refresh
        }
      } else {
        // No refresh token available, force logout if it's not a legacy token
        if (!getStaffToken()) {
          state.logout();
        }
      }
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // If parsing JSON fails, try to get the raw text (could be an HTML error page from proxy/cloud)
      let detail = data?.detail || data?.message;
      if (!detail) {
        try {
          const text = await response.text();
          detail = text.slice(0, 200) || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          detail = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      
      const errorBody = `[API Error] ${response.status} ${fetchOptions.method || 'GET'} ${url}: ${detail}`;
      console.error(errorBody);
      throw new ApiError(response.status, detail, url, fetchOptions.method || 'GET');
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Auto-retry once for network errors (Failed to fetch)
    if (error instanceof TypeError && error.message === 'Failed to fetch' && (options.retryCount || 0) === 0) {
      console.warn(`[API] Retrying connection to ${url}...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return apiRequest<T>(endpoint, { ...options, retryCount: 1 });
    }

    const detail = `Error de conexión: No se pudo contactar con el servidor (${url})`;
    throw new ApiError(0, detail, url, fetchOptions.method || 'GET', error);
  }
}

// ──────────────────────────────────────────────
// HTTP Method Helpers
// ──────────────────────────────────────────────

export const api = {
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'POST', body });
  },

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'PUT', body });
  },

  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

// ──────────────────────────────────────────────
// WebSocket URL Builder
// ──────────────────────────────────────────────

export function getWebSocketUrl(path: string): string {
  const wsBase = getApiBaseUrl().replace(/^http/, 'ws');
  return `${wsBase}${path}`;
}

/** Get the WebSocket URL for a comensal session */
export function getComensalWebSocketUrl(token: string, userId: string): string {
  return getWebSocketUrl(`/ws/session/${token}?user_id=${userId}`);
}

/** Get the WebSocket URL for staff dashboard */
export function getStaffWebSocketUrl(slug: string, staffToken: string): string {
  return getWebSocketUrl(`/ws/dashboard/${slug}?token=${staffToken}`);
}

export { TOKEN_KEYS, getApiBaseUrl as API_BASE_URL };
