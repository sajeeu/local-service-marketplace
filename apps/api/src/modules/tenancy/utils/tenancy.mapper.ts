import type {
  CurrentTenantResponse,
  MembershipDto,
  MembershipRole,
  OrganizationDto,
  TenantDto,
} from '@local-service-marketplace/shared-types';
import type {
  Membership,
  MembershipRole as PrismaMembershipRole,
  Organization,
  Tenant,
} from '@prisma/client';

const OWNER_ADMIN_PERMISSIONS = [
  'tenant.read',
  'tenant.switch',
  'organization.read',
  'organization.manage',
  'membership.read',
] as const;

const MEMBER_PERMISSIONS = [
  'tenant.read',
  'tenant.switch',
  'organization.read',
  'membership.read',
] as const;

export function permissionsForMembershipRole(
  role: PrismaMembershipRole | MembershipRole,
): string[] {
  if (role === 'OWNER' || role === 'ADMIN') {
    return [...OWNER_ADMIN_PERMISSIONS];
  }
  return [...MEMBER_PERMISSIONS];
}

export function toTenantDto(tenant: Tenant): TenantDto {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    type: tenant.type,
    status: tenant.status,
    createdAt: tenant.createdAt.toISOString(),
    updatedAt: tenant.updatedAt.toISOString(),
  };
}

export function toOrganizationDto(organization: Organization): OrganizationDto {
  return {
    id: organization.id,
    tenantId: organization.tenantId,
    legalName: organization.legalName,
    displayName: organization.displayName,
    description: organization.description,
    phone: organization.phone,
    website: organization.website,
    logo: organization.logo,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  };
}

export function toMembershipDto(membership: Membership): MembershipDto {
  return {
    id: membership.id,
    userId: membership.userId,
    tenantId: membership.tenantId,
    role: membership.role,
    status: membership.status,
    joinedAt: membership.joinedAt.toISOString(),
  };
}

export function toCurrentTenantResponse(
  tenant: Tenant,
  membership: Membership,
  organization: Organization | null,
): CurrentTenantResponse {
  return {
    tenant: toTenantDto(tenant),
    organization: organization ? toOrganizationDto(organization) : null,
    membership: toMembershipDto(membership),
    permissions: permissionsForMembershipRole(membership.role),
  };
}

export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return base.length > 0 ? base : 'tenant';
}
