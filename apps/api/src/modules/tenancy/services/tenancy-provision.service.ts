import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type { CurrentTenantResponse } from '@local-service-marketplace/shared-types';
import { RoleName, TenantType, type Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { RequestContextMeta } from '../../identity/interfaces/auth.interfaces';
import { AuditService } from '../../identity/services/audit.service';
import { MembershipService } from './membership.service';
import { OrganizationService } from './organization.service';
import { TenantService } from './tenant.service';
import { toCurrentTenantResponse } from '../utils/tenancy.mapper';

export type RegisterAccountType = 'CUSTOMER' | 'PROVIDER' | 'BUSINESS';

@Injectable()
export class TenancyProvisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    private readonly organizationService: OrganizationService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
  ) {}

  async provisionForRegistration(
    input: {
      userId: string;
      email: string;
      accountType: RegisterAccountType;
      organizationName?: string;
    },
    tx: Prisma.TransactionClient,
    meta: RequestContextMeta = {},
  ): Promise<CurrentTenantResponse> {
    const isBusiness = input.accountType === 'BUSINESS';
    const orgName = input.organizationName?.trim();

    if (isBusiness && !orgName) {
      throw new BadRequestException('Organization name is required for business accounts');
    }

    const tenantName = isBusiness ? orgName! : this.individualTenantName(input.email);

    const tenant = await this.tenantService.createTenant(
      {
        name: tenantName,
        type: isBusiness ? TenantType.BUSINESS : TenantType.INDIVIDUAL,
      },
      tx,
    );

    let organization = null;
    if (isBusiness) {
      organization = await this.organizationService.create(
        {
          tenantId: tenant.id,
          legalName: orgName!,
          displayName: orgName!,
        },
        tx,
      );
    }

    const membership = await this.membershipService.createOwnerMembership(
      input.userId,
      tenant.id,
      tx,
    );

    await tx.user.update({
      where: { id: input.userId },
      data: { activeTenantId: tenant.id },
    });

    // meta retained for call-site consistency; audits are written after the transaction commits
    void meta;

    return toCurrentTenantResponse(tenant, membership, organization);
  }

  async createBusinessOrganizationForUser(
    userId: string,
    input: {
      legalName: string;
      displayName: string;
      description?: string;
      phone?: string;
      website?: string;
      logo?: string;
    },
    meta: RequestContextMeta = {},
  ): Promise<CurrentTenantResponse> {
    const ownsBusiness = await this.tenantService.userOwnsBusinessTenant(userId);
    if (ownsBusiness) {
      throw new ConflictException('You already own a business organization');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === UserStatus.DISABLED) {
      throw new ConflictException('Unable to create organization for this account');
    }

    const businessRole = await this.prisma.role.findUnique({
      where: { name: RoleName.BUSINESS },
    });
    if (!businessRole) {
      throw new Error('BUSINESS role is not seeded');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await this.tenantService.createTenant(
        {
          name: input.displayName.trim(),
          type: TenantType.BUSINESS,
        },
        tx,
      );

      const organization = await this.organizationService.create(
        {
          tenantId: tenant.id,
          legalName: input.legalName,
          displayName: input.displayName,
          description: input.description,
          phone: input.phone,
          website: input.website,
          logo: input.logo,
        },
        tx,
      );

      const membership = await this.membershipService.createOwnerMembership(userId, tenant.id, tx);

      await tx.user.update({
        where: { id: userId },
        data: { activeTenantId: tenant.id },
      });

      const existingRole = await tx.userRole.findUnique({
        where: {
          userId_roleId: {
            userId,
            roleId: businessRole.id,
          },
        },
      });

      if (!existingRole) {
        await tx.userRole.create({
          data: {
            userId,
            roleId: businessRole.id,
          },
        });
      }

      return { tenant, organization, membership };
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'TENANT_CREATED',
      resourceType: 'Tenant',
      resourceId: result.tenant.id,
      metadata: { type: result.tenant.type, source: 'organization_create' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'ORGANIZATION_CREATED',
      resourceType: 'Organization',
      resourceId: result.organization.id,
      metadata: { tenantId: result.tenant.id, source: 'organization_create' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await this.auditService.log({
      actorUserId: userId,
      action: 'MEMBERSHIP_CREATED',
      resourceType: 'Membership',
      resourceId: result.membership.id,
      metadata: {
        tenantId: result.tenant.id,
        role: result.membership.role,
        source: 'organization_create',
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return toCurrentTenantResponse(result.tenant, result.membership, result.organization);
  }

  private individualTenantName(email: string): string {
    const local = email.split('@')[0] ?? 'user';
    return `${local}'s workspace`;
  }
}
