import type {
  AuthSessionResponse,
  AuthTokens,
  AuthUser,
  ForgotPasswordResponse,
  MessageResponse,
} from '@local-service-marketplace/shared-types';

const ACCESS_KEY = 'lsm_access_token';
const REFRESH_KEY = 'lsm_refresh_token';
const USER_KEY = 'lsm_auth_user';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }
  return sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (!canUseStorage()) {
    return null;
  }
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function persistSession(session: AuthSessionResponse): Promise<void> {
  if (canUseStorage()) {
    sessionStorage.setItem(ACCESS_KEY, session.tokens.accessToken);
    sessionStorage.setItem(REFRESH_KEY, session.tokens.refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
  }

  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authenticated: true }),
  });
}

export async function updateStoredTokens(tokens: AuthTokens, user?: AuthUser): Promise<void> {
  if (canUseStorage()) {
    sessionStorage.setItem(ACCESS_KEY, tokens.accessToken);
    sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authenticated: true }),
  });
}

export async function clearSession(): Promise<void> {
  if (canUseStorage()) {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  await fetch('/api/auth/session', { method: 'DELETE' });
}

export type { AuthSessionResponse, AuthUser, ForgotPasswordResponse, MessageResponse };
