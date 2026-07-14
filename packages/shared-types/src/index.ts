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

export type AccountType = 'CUSTOMER' | 'PROVIDER' | 'BUSINESS';

export type TenantType = 'INDIVIDUAL' | 'BUSINESS';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

export type MembershipRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'LEFT';

export interface AuthUser {
  id: string;
  email: string;
  status: UserStatus;
  emailVerifiedAt: string | null;
  roles: RoleName[];
  permissions: string[];
  activeTenantId: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface TenantDto {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationDto {
  id: string;
  tenantId: string;
  legalName: string;
  displayName: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipDto {
  id: string;
  userId: string;
  tenantId: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: string;
}

export interface CurrentTenantResponse {
  tenant: TenantDto;
  organization: OrganizationDto | null;
  membership: MembershipDto;
  permissions: string[];
}

export interface TenantListItem {
  tenant: TenantDto;
  organization: OrganizationDto | null;
  membership: MembershipDto;
}

export interface AuthIdentityResponse {
  user: AuthUser;
  tenantContext: CurrentTenantResponse | null;
}

export interface AuthSessionResponse extends AuthIdentityResponse {
  tokens: AuthTokens;
}

export interface RegisterRequest {
  email: string;
  password: string;
  accountType: AccountType;
  organizationName?: string;
}

export interface CreateOrganizationRequest {
  legalName: string;
  displayName: string;
  description?: string;
  phone?: string;
  website?: string;
  logo?: string;
}

export interface SwitchTenantRequest {
  tenantId: string;
}

export interface MessageResponse {
  message: string;
}

export interface ForgotPasswordResponse extends MessageResponse {
  /** Present only in non-production when a matching user exists. */
  resetToken?: string;
}
