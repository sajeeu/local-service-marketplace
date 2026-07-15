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

export type ServiceStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';

export type PricingModel = 'FIXED' | 'HOURLY' | 'DAILY' | 'QUOTE_REQUIRED';

export type ServiceMediaType = 'IMAGE' | 'VIDEO';

export type ServiceLocationType = 'REMOTE' | 'ON_SITE' | 'CUSTOMER_LOCATION' | 'PROVIDER_LOCATION';

export interface CategoryDto {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNodeDto extends CategoryDto {
  children: CategoryTreeNodeDto[];
}

export interface ServiceMediaDto {
  id: string;
  type: ServiceMediaType;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface ServiceTagDto {
  id: string;
  name: string;
  slug: string;
}

export interface ServiceLocationDto {
  id: string;
  type: ServiceLocationType;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadius: number | null;
}

export interface ServiceFaqDto {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface ServiceRequirementDto {
  id: string;
  description: string;
  isRequired: boolean;
  sortOrder: number;
}

export interface ServiceDto {
  id: string;
  providerId: string;
  categoryId: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  status: ServiceStatus;
  pricingModel: PricingModel;
  basePrice: number | null;
  currency: string;
  duration: number | null;
  cancellationPolicy: string | null;
  instantBookingEnabled: boolean;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category?: CategoryDto;
  media: ServiceMediaDto[];
  tags: ServiceTagDto[];
  locations: ServiceLocationDto[];
  faqs: ServiceFaqDto[];
  requirements: ServiceRequirementDto[];
}

export interface ServiceListItemDto {
  id: string;
  providerId: string;
  categoryId: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  status: ServiceStatus;
  pricingModel: PricingModel;
  basePrice: number | null;
  currency: string;
  duration: number | null;
  featured: boolean;
  updatedAt: string;
  categoryName?: string | null;
}

export interface ServiceListResponse {
  items: ServiceListItemDto[];
  meta: PaginationMeta;
}

export interface CreateServiceRequest {
  categoryId: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  pricingModel: PricingModel;
  basePrice?: number | null;
  currency?: string;
  duration?: number | null;
  cancellationPolicy?: string | null;
  instantBookingEnabled?: boolean;
  featured?: boolean;
  tags?: string[];
  locations?: Array<{
    type: ServiceLocationType;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    serviceRadius?: number | null;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
    sortOrder?: number;
  }>;
  requirements?: Array<{
    description: string;
    isRequired?: boolean;
    sortOrder?: number;
  }>;
  media?: Array<{
    type: ServiceMediaType;
    url: string;
    altText?: string | null;
    sortOrder?: number;
  }>;
}

export interface UpdateServiceRequest {
  categoryId?: string;
  title?: string;
  shortDescription?: string | null;
  description?: string | null;
  pricingModel?: PricingModel;
  basePrice?: number | null;
  currency?: string;
  duration?: number | null;
  cancellationPolicy?: string | null;
  instantBookingEnabled?: boolean;
  featured?: boolean;
  tags?: string[];
  locations?: Array<{
    type: ServiceLocationType;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    serviceRadius?: number | null;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
    sortOrder?: number;
  }>;
  requirements?: Array<{
    description: string;
    isRequired?: boolean;
    sortOrder?: number;
  }>;
  media?: Array<{
    type: ServiceMediaType;
    url: string;
    altText?: string | null;
    sortOrder?: number;
  }>;
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateServiceMediaRequest {
  type: ServiceMediaType;
  url: string;
  altText?: string | null;
  sortOrder?: number;
}

export interface UpdateServiceMediaRequest {
  type?: ServiceMediaType;
  url?: string;
  altText?: string | null;
  sortOrder?: number;
}

export interface CreateServiceTagRequest {
  name: string;
}

export interface CreateServiceFaqRequest {
  question: string;
  answer: string;
  sortOrder?: number;
}

export interface UpdateServiceFaqRequest {
  question?: string;
  answer?: string;
  sortOrder?: number;
}

export interface CreateServiceRequirementRequest {
  description: string;
  isRequired?: boolean;
  sortOrder?: number;
}

export interface UpdateServiceRequirementRequest {
  description?: string;
  isRequired?: boolean;
  sortOrder?: number;
}

export interface CreateServiceLocationRequest {
  type: ServiceLocationType;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadius?: number | null;
}

export interface UpdateServiceLocationRequest {
  type?: ServiceLocationType;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadius?: number | null;
}
