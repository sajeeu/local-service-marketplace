import type {
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
  AuthIdentityResponse,
  AuthSessionResponse,
  AuthTokens,
  AuthUser,
  AutocompleteResponse,
  CategoryDto,
  CategoryTreeNodeDto,
  CreateOrganizationRequest,
  CreateProviderAvailabilityRequest,
  CreateServiceRequest,
  CurrentTenantResponse,
  ForgotPasswordResponse,
  HealthCheckResult,
  MessageResponse,
  PopularSearchesResponse,
  ProviderAvailabilityDto,
  ProviderListResponse,
  ProviderPrivateProfileDto,
  ProviderPublicProfileDto,
  ProviderSearchResponse,
  PublicServiceDetailDto,
  RecentlyViewedResponse,
  RegisterRequest,
  ReviewProviderVerificationRequest,
  ServiceDto,
  ServiceListResponse,
  ServiceSearchResponse,
  SubmitProviderVerificationRequest,
  TenantListItem,
  UpdateProviderAvailabilityRequest,
  UpdateProviderProfileRequest,
  UpdateServiceRequest,
} from '@local-service-marketplace/shared-types';
import { env } from './env';
import { getAccessToken, getActiveTenantId } from '@/features/auth/session';

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

async function request<T>(
  path: string,
  init?: RequestInit & { auth?: boolean; tenantHeader?: boolean },
): Promise<T> {
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

    if (init.tenantHeader !== false) {
      const tenantId = getActiveTenantId();
      if (tenantId) {
        headers.set('X-Tenant-Id', tenantId);
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch (error) {
    throw new ApiClientError(
      'Unable to reach the API. Confirm the backend is running on the configured URL.',
      {
        code: 'CONNECTION_REFUSED',
        status: 0,
        details: {
          url,
          cause: error instanceof Error ? error.message : String(error),
        },
      },
    );
  }

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

  register(input: RegisterRequest): Promise<AuthSessionResponse> {
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

  me(): Promise<AuthIdentityResponse> {
    return request<AuthIdentityResponse>('auth/me', { auth: true });
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

  listTenants(): Promise<TenantListItem[]> {
    return request<TenantListItem[]>('tenants', { auth: true });
  },

  getCurrentTenant(): Promise<CurrentTenantResponse> {
    return request<CurrentTenantResponse>('tenants/current', { auth: true });
  },

  switchTenant(tenantId: string): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>('tenants/switch', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ tenantId }),
    });
  },

  createOrganization(input: CreateOrganizationRequest): Promise<AuthSessionResponse> {
    return request<AuthSessionResponse>('organizations', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(input),
    });
  },

  getMyProvider(): Promise<ProviderPrivateProfileDto> {
    return request<ProviderPrivateProfileDto>('providers/me', { auth: true });
  },

  updateMyProvider(input: UpdateProviderProfileRequest): Promise<ProviderPrivateProfileDto> {
    return request<ProviderPrivateProfileDto>('providers/me', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(input),
    });
  },

  listProviders(page = 1, limit = 20): Promise<ProviderListResponse> {
    return request<ProviderListResponse>(`providers?page=${page}&limit=${limit}`, {
      auth: true,
    });
  },

  updateProvider(
    id: string,
    input: UpdateProviderProfileRequest,
  ): Promise<ProviderPrivateProfileDto> {
    return request<ProviderPrivateProfileDto>(`providers/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(input),
    });
  },

  getPublicProvider(id: string): Promise<ProviderPublicProfileDto> {
    return request<ProviderPublicProfileDto>(`providers/${id}`);
  },

  listMyAvailability(): Promise<ProviderAvailabilityDto[]> {
    return request<ProviderAvailabilityDto[]>('providers/me/availability', { auth: true });
  },

  createMyAvailability(input: CreateProviderAvailabilityRequest): Promise<ProviderAvailabilityDto> {
    return request<ProviderAvailabilityDto>('providers/me/availability', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(input),
    });
  },

  updateMyAvailability(
    availabilityId: string,
    input: UpdateProviderAvailabilityRequest,
  ): Promise<ProviderAvailabilityDto> {
    return request<ProviderAvailabilityDto>(`providers/me/availability/${availabilityId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(input),
    });
  },

  deleteMyAvailability(availabilityId: string): Promise<MessageResponse> {
    return request<MessageResponse>(`providers/me/availability/${availabilityId}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  submitMyVerification(
    input: SubmitProviderVerificationRequest,
  ): Promise<ProviderPrivateProfileDto> {
    return request<ProviderPrivateProfileDto>('providers/me/verification', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(input),
    });
  },

  reviewProviderVerification(
    providerId: string,
    input: ReviewProviderVerificationRequest,
  ): Promise<ProviderPrivateProfileDto> {
    return request<ProviderPrivateProfileDto>(`admin/providers/${providerId}/verification`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(input),
    });
  },

  getCategoryTree(): Promise<CategoryTreeNodeDto[]> {
    return request<CategoryTreeNodeDto[]>('categories/tree');
  },

  listCategories(): Promise<CategoryDto[]> {
    return request<CategoryDto[]>('categories');
  },

  listMyServices(page = 1, limit = 20): Promise<ServiceListResponse> {
    return request<ServiceListResponse>(`services/me?page=${page}&limit=${limit}`, {
      auth: true,
    });
  },

  getService(id: string): Promise<ServiceDto> {
    return request<ServiceDto>(`services/${id}`, { auth: true });
  },

  createService(input: CreateServiceRequest): Promise<ServiceDto> {
    return request<ServiceDto>('services', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(input),
    });
  },

  updateService(id: string, input: UpdateServiceRequest): Promise<ServiceDto> {
    return request<ServiceDto>(`services/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(input),
    });
  },

  deleteService(id: string): Promise<MessageResponse> {
    return request<MessageResponse>(`services/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  publishService(id: string): Promise<ServiceDto> {
    return request<ServiceDto>(`services/${id}/publish`, {
      method: 'PATCH',
      auth: true,
    });
  },

  pauseService(id: string): Promise<ServiceDto> {
    return request<ServiceDto>(`services/${id}/pause`, {
      method: 'PATCH',
      auth: true,
    });
  },

  archiveService(id: string): Promise<ServiceDto> {
    return request<ServiceDto>(`services/${id}/archive`, {
      method: 'PATCH',
      auth: true,
    });
  },

  searchServices(params: Record<string, unknown> | object): Promise<ServiceSearchResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    const query = searchParams.toString();
    return request<ServiceSearchResponse>(`search${query ? `?${query}` : ''}`);
  },

  searchByCategory(
    slug: string,
    params: Record<string, unknown> | object,
  ): Promise<ServiceSearchResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    const query = searchParams.toString();
    return request<ServiceSearchResponse>(`search/categories/${slug}${query ? `?${query}` : ''}`);
  },

  searchProviders(params: Record<string, unknown>): Promise<ProviderSearchResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const query = searchParams.toString();
    return request<ProviderSearchResponse>(`search/providers${query ? `?${query}` : ''}`);
  },

  autocomplete(q: string, limit?: number): Promise<AutocompleteResponse> {
    const params = new URLSearchParams({ q });
    if (limit) {
      params.append('limit', String(limit));
    }
    return request<AutocompleteResponse>(`search/autocomplete?${params.toString()}`);
  },

  popularSearches(limit?: number): Promise<PopularSearchesResponse> {
    const params = limit ? `?limit=${limit}` : '';
    return request<PopularSearchesResponse>(`search/popular${params}`);
  },

  recentlyViewed(limit?: number): Promise<RecentlyViewedResponse> {
    const params = limit ? `?limit=${limit}` : '';
    return request<RecentlyViewedResponse>(`search/recent${params}`, { auth: true });
  },

  trackServiceView(serviceId: string): Promise<MessageResponse> {
    return request<MessageResponse>(`search/views/${serviceId}`, {
      method: 'POST',
      auth: true,
    });
  },

  getPublicService(id: string): Promise<PublicServiceDetailDto> {
    return request<PublicServiceDetailDto>(`search/services/${id}`);
  },
};

export type { AuthTokens, AuthUser, CurrentTenantResponse, TenantListItem };
