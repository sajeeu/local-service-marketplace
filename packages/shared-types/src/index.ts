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

export type ProviderVerificationStatus =
  'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

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

export interface ProviderQualificationDto {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  documentUrl: string | null;
}

export interface ProviderCertificationDto {
  id: string;
  name: string;
  issuer: string;
  issueDate: string | null;
  expiryDate: string | null;
  credentialId: string | null;
  documentUrl: string | null;
}

export interface ProviderLanguageDto {
  id: string;
  code: string;
  label: string;
  proficiency: string | null;
}

export interface ProviderAvailabilityDto {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface ProviderVerificationDocumentMeta {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
}

export interface ProviderVerificationDto {
  id: string;
  status: ProviderVerificationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  documentMetadata: ProviderVerificationDocumentMeta[] | null;
}

export interface ProviderPublicQualificationDto {
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
}

export interface ProviderPublicCertificationDto {
  name: string;
  issuer: string;
  issueDate: string | null;
  expiryDate: string | null;
}

export interface ProviderPublicProfileDto {
  id: string;
  displayName: string;
  bio: string | null;
  profilePhoto: string | null;
  yearsOfExperience: number;
  verificationStatus: ProviderVerificationStatus;
  averageRating: number;
  completedJobs: number;
  responseRate: number | null;
  responseTime: number | null;
  languages: Array<{
    code: string;
    label: string;
    proficiency: string | null;
  }>;
  qualifications: ProviderPublicQualificationDto[];
  certifications: ProviderPublicCertificationDto[];
}

export interface ProviderPrivateProfileDto {
  id: string;
  tenantId: string;
  userId: string;
  displayName: string;
  bio: string | null;
  profilePhoto: string | null;
  yearsOfExperience: number;
  verificationStatus: ProviderVerificationStatus;
  averageRating: number;
  completedJobs: number;
  responseRate: number | null;
  responseTime: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  qualifications: ProviderQualificationDto[];
  certifications: ProviderCertificationDto[];
  languages: ProviderLanguageDto[];
  verifications: ProviderVerificationDto[];
}

export interface ProviderListItemDto {
  id: string;
  userId: string;
  displayName: string;
  verificationStatus: ProviderVerificationStatus;
  isActive: boolean;
  yearsOfExperience: number;
  averageRating: number;
  completedJobs: number;
  createdAt: string;
}

export interface ProviderListResponse {
  items: ProviderListItemDto[];
  meta: PaginationMeta;
}

export interface UpdateProviderProfileRequest {
  displayName?: string;
  bio?: string | null;
  profilePhoto?: string | null;
  yearsOfExperience?: number;
  isActive?: boolean;
  qualifications?: Array<{
    title: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string | null;
    documentUrl?: string | null;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate?: string | null;
    expiryDate?: string | null;
    credentialId?: string | null;
    documentUrl?: string | null;
  }>;
  languages?: Array<{
    code: string;
    label: string;
    proficiency?: string | null;
  }>;
}

export interface CreateProviderAvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface UpdateProviderAvailabilityRequest {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

export interface SubmitProviderVerificationRequest {
  documents: ProviderVerificationDocumentMeta[];
}

export type ProviderVerificationReviewAction = 'APPROVE' | 'REJECT' | 'SUSPEND';

export interface ReviewProviderVerificationRequest {
  action: ProviderVerificationReviewAction;
  rejectionReason?: string;
}
