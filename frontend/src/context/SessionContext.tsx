"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { sessionService } from '@/lib/api/session.service';
import { getSessionToken, getSlug, getSessionUserId, clearSessionAuth } from '@/lib/api/client';
import type { SessionResponse, SessionUserResponse } from '@/types/api.types';

/**
 * SessionState holds the active table session data.
 * Populated after a user scans a QR and joins a session.
 */
interface SessionState {
  /** The full session object from the API. */
  session: SessionResponse | null;
  /** The current user within the session. */
  currentUser: SessionUserResponse | null;
  /** The restaurant slug. */
  slug: string | null;
  /** The session token (JWT from QR). */
  sessionToken: string | null;
  /** Loading state. */
  loading: boolean;
  /** Error message. */
  error: string | null;
}

interface SessionContextType extends SessionState {
  /** Refresh session data from the API. */
  refreshSession: () => Promise<void>;
  /** Set session after joining. */
  setSessionData: (session: SessionResponse, user: SessionUserResponse, slug: string, token: string) => void;
  /** Clear session (logout/expire). */
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    session: null,
    currentUser: null,
    slug: null,
    sessionToken: null,
    loading: false,
    error: null,
  });

  /** Restore session from localStorage on mount. */
  useEffect(() => {
    const token = getSessionToken();
    const slug = getSlug();
    const userId = getSessionUserId();

    if (token && slug) {
      setState(prev => ({ ...prev, sessionToken: token, slug, loading: true }));

      sessionService.getSession(slug, token)
        .then(session => {
          const currentUser = session.users.find(u => u.id === userId) || null;
          setState(prev => ({
            ...prev,
            session,
            currentUser,
            loading: false,
            error: null,
          }));
        })
        .catch(() => {
          // Session expired or invalid
          clearSessionAuth();
          setState(prev => ({
            ...prev,
            loading: false,
            error: null,
            session: null,
            currentUser: null,
          }));
        });
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const { slug, sessionToken } = state;
    if (!slug || !sessionToken) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const session = await sessionService.getSession(slug, sessionToken);
      const userId = getSessionUserId();
      const currentUser = session.users.find(u => u.id === userId) || null;
      setState(prev => ({ ...prev, session, currentUser, loading: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar sesión';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [state.slug, state.sessionToken]);

  const setSessionData = useCallback(
    (session: SessionResponse, user: SessionUserResponse, slug: string, token: string) => {
      setState({
        session,
        currentUser: user,
        slug,
        sessionToken: token,
        loading: false,
        error: null,
      });
    },
    []
  );

  const clearSession = useCallback(() => {
    clearSessionAuth();
    setState({
      session: null,
      currentUser: null,
      slug: null,
      sessionToken: null,
      loading: false,
      error: null,
    });
  }, []);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        refreshSession,
        setSessionData,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Custom hook to access session context.
 * @throws {Error} if used outside of SessionProvider.
 */
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
