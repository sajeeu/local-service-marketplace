import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AuthSessionResponse,
  CurrentTenantResponse,
  TenantListItem,
} from '@local-service-marketplace/shared-types';
import { MembershipStatus, RoleName, TenantStatus, UserStatus, type User } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { RequestContextMeta } from '../../identity/interfaces/auth.interfaces';
import { AuditService } from '../../identity/services/audit.service';
import { TokenService } from '../../identity/services/token.service';
import { MembershipService } from './membership.service';
import { TenantContextService } from './tenant-context.service';
import {
  toCurrentTenantResponse,
  toMembershipDto,
  toOrganizationDto,
  toTenantDto,
} from '../utils/tenancy.mapper';

type UserWithRoles = User & {
  roles: Array<{
    role: {
      name: RoleName;
      permissions: Array<{
        permission: { code: string };
      }>;
    };
  }>;
};

@Injectable()
export class TenancyQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly tenantContextService: TenantContextService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
  ) {}

  async listTenantsForUser(userId: string): Promise<TenantListItem[]> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
      },
      include: {
        tenant: {
          include: {
            organization: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((membership) => ({
      tenant: toTenantDto(membership.tenant),
      organization: membership.tenant.organization
        ? toOrganizationDto(membership.tenant.organization)
        : null,
      membership: toMembershipDto(membership),
    }));
  }

  async getCurrentTenant(userId: string): Promise<CurrentTenantResponse> {
    return this.tenantContextService.requireCurrentForUser(userId);
  }

  async switchTenant(
    userId: string,
    tenantId: string,
    meta: RequestContextMeta = {},
  ): Promise<AuthSessionResponse> {
    const membership = await this.membershipService.findActiveMembership(userId, tenantId);
    if (!membership) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { organization: true },
    });

    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new NotFoundException('Tenant not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeTenantId: tenantId },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userInclude(),
    });

    if (!user || user.status === UserStatus.DISABLED) {
      throw new ForbiddenException('Unable to switch tenant for this account');
    }

    const roles = this.extractRoles(user);
    const tokens = await this.tokenService.issueTokenPair(user, roles, meta, tenantId);
    const tenantContext = toCurrentTenantResponse(tenant, membership, tenant.organization);

    await this.auditService.log({
      actorUserId: userId,
      action: 'TENANT_SWITCHED',
      resourceType: 'Tenant',
      resourceId: tenantId,
      metadata: { membershipId: membership.id },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      user: this.toAuthUser(user),
      tokens,
      tenantContext,
    };
  }

  private userInclude() {
    return {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    } as const;
  }

  private extractRoles(user: UserWithRoles): RoleName[] {
    return user.roles.map((entry) => entry.role.name);
  }

  private extractPermissions(user: UserWithRoles): string[] {
    const codes = user.roles.flatMap((entry) =>
      entry.role.permissions.map((rp) => rp.permission.code),
    );
    return [...new Set(codes)].sort();
  }

  private toAuthUser(user: UserWithRoles) {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      roles: this.extractRoles(user),
      permissions: this.extractPermissions(user),
      activeTenantId: user.activeTenantId,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
