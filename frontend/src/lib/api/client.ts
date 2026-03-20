/**
 * CheckNow! — HTTP API Client
 * Central fetch wrapper with token management, error handling, and base URL config.
 */

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const API_BASE_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

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

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
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
  /** If true, include the staff JWT Bearer token. */
  staffAuth?: boolean;
  /** If true, include X-Session-User-Id header. */
  sessionAuth?: boolean;
}

/**
 * Central API fetch wrapper.
 * Handles JSON serialization, auth headers, and error normalization.
 */
async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, staffAuth = false, sessionAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Staff JWT token
  if (staffAuth) {
    const token = getStaffToken();
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

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const detail = data?.detail || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(response.status, detail);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Error de conexión con el servidor. Verifica tu conexión.', error);
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
  const wsBase = API_BASE_URL.replace(/^http/, 'ws');
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

export { TOKEN_KEYS, API_BASE_URL };
