import type {
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
  HealthCheckResult,
} from '@local-service-marketplace/shared-types';
import { env } from './env';

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
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
};
