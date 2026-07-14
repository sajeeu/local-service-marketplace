import type {
  AuthSessionResponse,
  AuthTokens,
  AuthUser,
  CurrentTenantResponse,
  ForgotPasswordResponse,
  MessageResponse,
} from '@local-service-marketplace/shared-types';

const ACCESS_KEY = 'lsm_access_token';
const REFRESH_KEY = 'lsm_refresh_token';
const USER_KEY = 'lsm_auth_user';
const TENANT_KEY = 'lsm_active_tenant_id';
const TENANT_CONTEXT_KEY = 'lsm_tenant_context';

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

export function getActiveTenantId(): string | null {
  if (!canUseStorage()) {
    return null;
  }
  return sessionStorage.getItem(TENANT_KEY);
}

export function getStoredTenantContext(): CurrentTenantResponse | null {
  if (!canUseStorage()) {
    return null;
  }
  const raw = sessionStorage.getItem(TENANT_CONTEXT_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as CurrentTenantResponse;
  } catch {
    return null;
  }
}

function persistTenantContext(tenantContext: CurrentTenantResponse | null | undefined): void {
  if (!canUseStorage()) {
    return;
  }

  if (tenantContext) {
    sessionStorage.setItem(TENANT_KEY, tenantContext.tenant.id);
    sessionStorage.setItem(TENANT_CONTEXT_KEY, JSON.stringify(tenantContext));
    return;
  }

  sessionStorage.removeItem(TENANT_KEY);
  sessionStorage.removeItem(TENANT_CONTEXT_KEY);
}

export async function persistSession(session: AuthSessionResponse): Promise<void> {
  if (canUseStorage()) {
    sessionStorage.setItem(ACCESS_KEY, session.tokens.accessToken);
    sessionStorage.setItem(REFRESH_KEY, session.tokens.refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
    persistTenantContext(session.tenantContext);
  }

  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authenticated: true }),
  });
}

export async function updateStoredTokens(
  tokens: AuthTokens,
  user?: AuthUser,
  tenantContext?: CurrentTenantResponse | null,
): Promise<void> {
  if (canUseStorage()) {
    sessionStorage.setItem(ACCESS_KEY, tokens.accessToken);
    sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    if (tenantContext !== undefined) {
      persistTenantContext(tenantContext);
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
    sessionStorage.removeItem(TENANT_KEY);
    sessionStorage.removeItem(TENANT_CONTEXT_KEY);
  }

  await fetch('/api/auth/session', { method: 'DELETE' });
}

export type { AuthSessionResponse, AuthUser, ForgotPasswordResponse, MessageResponse };
