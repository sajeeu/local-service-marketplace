import type { RoleName } from '@prisma/client';
import type { CurrentTenantResponse } from '@local-service-marketplace/shared-types';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  roles: RoleName[];
  tid?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: RoleName[];
  permissions: string[];
  activeTenantId: string | null;
  tenantContext: CurrentTenantResponse | null;
  /** Combined platform + tenant-scoped permissions for the active tenant. */
  tenantPermissions: string[];
}

export interface RequestContextMeta {
  ipAddress?: string;
  userAgent?: string;
}
