'use client';

import type { OrganizationDto } from '@local-service-marketplace/shared-types';
import { useTenantContext } from '../tenant-provider';

export function useCurrentOrganization(): OrganizationDto | null {
  const { current } = useTenantContext();
  return current?.organization ?? null;
}
