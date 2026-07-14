import { ConflictException } from '@nestjs/common';
import { RoleName, TenantType, UserStatus } from '@prisma/client';
import { AuditService } from '../../identity/services/audit.service';
import { MembershipService } from './membership.service';
import { OrganizationService } from './organization.service';
import { TenancyProvisionService } from './tenancy-provision.service';
import { TenantService } from './tenant.service';

describe('TenancyProvisionService', () => {
  const prisma = {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  };

  const tenantService = {
    createTenant: jest.fn(),
    userOwnsBusinessTenant: jest.fn(),
  };

  const organizationService = {
    create: jest.fn(),
  };

  const membershipService = {
    createOwnerMembership: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  const service = new TenancyProvisionService(
    prisma as never,
    tenantService as unknown as TenantService,
    organizationService as unknown as OrganizationService,
    membershipService as unknown as MembershipService,
    auditService as unknown as AuditService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provisions an individual tenant during registration', async () => {
    const tx = {
      user: { update: jest.fn() },
    };
    tenantService.createTenant.mockResolvedValue({
      id: 't1',
      name: "user's workspace",
      slug: 'user-s-workspace',
      type: TenantType.INDIVIDUAL,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    membershipService.createOwnerMembership.mockResolvedValue({
      id: 'm1',
      userId: 'user-1',
      tenantId: 't1',
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await service.provisionForRegistration(
      {
        userId: 'user-1',
        email: 'user@example.com',
        accountType: 'CUSTOMER',
      },
      tx as never,
    );

    expect(result.tenant.type).toBe('INDIVIDUAL');
    expect(result.organization).toBeNull();
    expect(organizationService.create).not.toHaveBeenCalled();
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { activeTenantId: 't1' },
    });
  });

  it('provisions a business tenant and organization during registration', async () => {
    const tx = {
      user: { update: jest.fn() },
    };
    tenantService.createTenant.mockResolvedValue({
      id: 't2',
      name: 'Acme',
      slug: 'acme',
      type: TenantType.BUSINESS,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    organizationService.create.mockResolvedValue({
      id: 'org-1',
      tenantId: 't2',
      legalName: 'Acme',
      displayName: 'Acme',
      description: null,
      phone: null,
      website: null,
      logo: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    membershipService.createOwnerMembership.mockResolvedValue({
      id: 'm2',
      userId: 'user-2',
      tenantId: 't2',
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await service.provisionForRegistration(
      {
        userId: 'user-2',
        email: 'biz@example.com',
        accountType: 'BUSINESS',
        organizationName: 'Acme',
      },
      tx as never,
    );

    expect(result.organization?.displayName).toBe('Acme');
    expect(organizationService.create).toHaveBeenCalled();
  });

  it('rejects creating a second owned business organization', async () => {
    tenantService.userOwnsBusinessTenant.mockResolvedValue(true);
    await expect(
      service.createBusinessOrganizationForUser('user-1', {
        legalName: 'Another',
        displayName: 'Another',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a business organization for eligible users', async () => {
    tenantService.userOwnsBusinessTenant.mockResolvedValue(false);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.ACTIVE,
    });
    prisma.role.findUnique.mockResolvedValue({ id: 'role-business', name: RoleName.BUSINESS });

    const tenant = {
      id: 't3',
      name: 'New Biz',
      slug: 'new-biz',
      type: TenantType.BUSINESS,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const organization = {
      id: 'org-2',
      tenantId: 't3',
      legalName: 'New Biz Ltd',
      displayName: 'New Biz',
      description: null,
      phone: null,
      website: null,
      logo: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const membership = {
      id: 'm3',
      userId: 'user-1',
      tenantId: 't3',
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: { update: jest.fn() },
        userRole: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
      };
      tenantService.createTenant.mockResolvedValue(tenant);
      organizationService.create.mockResolvedValue(organization);
      membershipService.createOwnerMembership.mockResolvedValue(membership);
      return callback(tx);
    });

    const result = await service.createBusinessOrganizationForUser('user-1', {
      legalName: 'New Biz Ltd',
      displayName: 'New Biz',
    });

    expect(result.tenant.id).toBe('t3');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ORGANIZATION_CREATED' }),
    );
  });
});
