import type {
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
  AuthSessionResponse,
  AuthUser,
  ForgotPasswordResponse,
  HealthCheckResult,
  MessageResponse,
} from '@local-service-marketplace/shared-types';
import { env } from './env';
import { getAccessToken } from '@/features/auth/session';

export class ApiClientError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown> | unknown[];
  readonly status: number;

  constructor(
    message: string,
    options: {
      code: string;
      status: number;
      details?: Record<string, unknown> | unknown[];
    },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

async function request<T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> {
  const url = `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (init?.auth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  let body: ApiResponse<T> | null = null;

  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError('Invalid JSON response from API', {
      code: 'INVALID_RESPONSE',
      status: response.status,
    });
  }

  if (!response.ok || !body.success) {
    const errorBody = body as ApiErrorResponse;
    throw new ApiClientError(errorBody.error?.message ?? 'Request failed', {
      code: errorBody.error?.code ?? 'REQUEST_FAILED',
      status: response.status,
      details: errorBody.error?.details,
    });
  }

  return (body as ApiSuccessResponse<T>).data;
}

export const apiClient = {
  getHealth(): Promise<HealthCheckResult> {
    return request<HealthCheckResult>('health');
  },

  register(input: { email: string; password: string }): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>('auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  login(input: { email: string; password: string }): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  refresh(refreshToken: string): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>('auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout(refreshToken: string): Promise<MessageResponse> {
    return request<MessageResponse>('auth/logout', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ refreshToken }),
    });
  },

  me(): Promise<AuthUser> {
    return request<AuthUser>('auth/me', { auth: true });
  },

  forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return request<ForgotPasswordResponse>('auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(input: { token: string; password: string }): Promise<MessageResponse> {
    return request<MessageResponse>('auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
