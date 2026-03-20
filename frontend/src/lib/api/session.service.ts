/**
 * CheckNow! — Session Service
 * Manages the table session lifecycle (open, join, get, close).
 */

import { api, setSessionAuth } from './client';
import type {
  SessionCreate,
  SessionJoin,
  SessionResponse,
  SessionUserResponse,
} from '@/types/api.types';

export const sessionService = {
  /** Open a new session for a table (Staff only). */
  async openSession(slug: string, data: SessionCreate): Promise<SessionResponse> {
    return api.post<SessionResponse>(`/api/${slug}/sessions`, data, { staffAuth: true });
  },

  /** Get active session info via its token. */
  async getSession(slug: string, token: string): Promise<SessionResponse> {
    return api.get<SessionResponse>(`/api/${slug}/sessions/${token}`);
  },

  /** Join an active table session. Persists session auth locally. */
  async joinSession(slug: string, token: string, data: SessionJoin): Promise<SessionUserResponse> {
    const response = await api.post<SessionUserResponse>(
      `/api/${slug}/sessions/${token}/join`,
      data
    );

    // Persist session auth
    setSessionAuth({
      session_user_id: response.id,
      session_token: token,
      slug,
    });

    return response;
  },

  /** Get all users in a session. */
  async getSessionUsers(slug: string, token: string): Promise<SessionUserResponse[]> {
    return api.get<SessionUserResponse[]>(`/api/${slug}/sessions/${token}/users`);
  },

  /** Close an active session (Staff only). */
  async closeSession(slug: string, token: string): Promise<SessionResponse> {
    return api.post<SessionResponse>(`/api/${slug}/sessions/${token}/close`, undefined, {
      staffAuth: true,
    });
  },
};
