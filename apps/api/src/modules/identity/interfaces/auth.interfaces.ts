import type { RoleName } from '@prisma/client';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  roles: RoleName[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: RoleName[];
  permissions: string[];
}

export interface RequestContextMeta {
  ipAddress?: string;
  userAgent?: string;
}
