import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CurrentTenantResponse } from '@local-service-marketplace/shared-types';
import {
  MembershipStatus,
  TenantStatus,
  type Membership,
  type Organization,
  type Tenant,
} from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { toCurrentTenantResponse } from '../utils/tenancy.mapper';

export interface TenantContextParts {
  tenant: Tenant;
  membership: Membership;
  organization: Organization | null;
  permissions: string[];
}

@Injectable()
export class TenantContextService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve active tenant: header → JWT tid → User.activeTenantId.
   * Header/JWT values are always validated against ACTIVE membership.
   */
  async resolve(input: {
    userId: string;
    headerTenantId?: string | null;
    jwtTenantId?: string | null;
    storedTenantId?: string | null;
  }): Promise<TenantContextParts | null> {
    const candidates = [
      input.headerTenantId?.trim() || null,
      input.jwtTenantId?.trim() || null,
      input.storedTenantId?.trim() || null,
    ].filter((value): value is string => Boolean(value));

    if (candidates.length === 0) {
      return null;
    }

    const preferred = candidates[0]!;
    const explicitFromClient = Boolean(input.headerTenantId?.trim());

    try {
      return await this.loadContext(input.userId, preferred);
    } catch (error) {
      if (explicitFromClient) {
        throw error;
      }

      // Fall through remaining candidates when JWT/stored id is stale.
      for (const candidate of candidates.slice(1)) {
        try {
          return await this.loadContext(input.userId, candidate);
        } catch {
          // continue
        }
      }

      return null;
    }
  }

  async getCurrentForUser(userId: string): Promise<CurrentTenantResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { activeTenantId: true },
    });

    if (!user?.activeTenantId) {
      return null;
    }

    try {
      const context = await this.loadContext(userId, user.activeTenantId);
      return toCurrentTenantResponse(context.tenant, context.membership, context.organization);
    } catch {
      return null;
    }
  }

  async requireCurrentForUser(userId: string): Promise<CurrentTenantResponse> {
    const current = await this.getCurrentForUser(userId);
    if (!current) {
      throw new NotFoundException('No active tenant context');
    }
    return current;
  }

  async loadContext(userId: string, tenantId: string): Promise<TenantContextParts> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
      include: {
        tenant: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    if (membership.tenant.status !== TenantStatus.ACTIVE) {
      throw new ForbiddenException('This tenant is not active');
    }

    const response = toCurrentTenantResponse(
      membership.tenant,
      membership,
      membership.tenant.organization,
    );

    return {
      tenant: membership.tenant,
      membership,
      organization: membership.tenant.organization,
      permissions: response.permissions,
    };
  }
}
