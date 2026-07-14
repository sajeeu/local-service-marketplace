/**
 * Shared API response contracts and auth identity types.
 * Domain-specific marketplace types belong in their owning app modules.
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown> | unknown[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthCheckComponent {
  status: 'up' | 'down';
  latencyMs?: number;
  message?: string;
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  checks: {
    app: HealthCheckComponent;
    database: HealthCheckComponent;
    redis: HealthCheckComponent;
  };
}

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'PENDING_VERIFICATION';

export type RoleName = 'CUSTOMER' | 'PROVIDER' | 'BUSINESS' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  status: UserStatus;
  emailVerifiedAt: string | null;
  roles: RoleName[];
  permissions: string[];
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthSessionResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface MessageResponse {
  message: string;
}

export interface ForgotPasswordResponse extends MessageResponse {
  /** Present only in non-production when a matching user exists. */
  resetToken?: string;
}
