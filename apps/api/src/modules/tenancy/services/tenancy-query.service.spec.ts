import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MembershipStatus, TenantStatus, TenantType, UserStatus } from '@prisma/client';
import { AuditService } from '../../identity/services/audit.service';
import { TokenService } from '../../identity/services/token.service';
import { MembershipService } from './membership.service';
import { TenantContextService } from './tenant-context.service';
import { TenancyQueryService } from './tenancy-query.service';

describe('TenancyQueryService', () => {
  const prisma = {
    membership: {
      findMany: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const membershipService = {
    findActiveMembership: jest.fn(),
  };

  const tenantContextService = {
    requireCurrentForUser: jest.fn(),
  };

  const tokenService = {
    issueTokenPair: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  const service = new TenancyQueryService(
    prisma as never,
    membershipService as unknown as MembershipService,
    tenantContextService as unknown as TenantContextService,
    tokenService as unknown as TokenService,
    auditService as unknown as AuditService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists active tenant memberships for a user', async () => {
    prisma.membership.findMany.mockResolvedValue([
      {
        id: 'm1',
        userId: 'user-1',
        tenantId: 't1',
        role: 'OWNER',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        tenant: {
          id: 't1',
          name: 'Workspace',
          slug: 'workspace',
          type: TenantType.INDIVIDUAL,
          status: TenantStatus.ACTIVE,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          organization: null,
        },
      },
    ]);

    const result = await service.listTenantsForUser('user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.tenant.id).toBe('t1');
    expect(result[0]?.organization).toBeNull();
  });

  it('switches tenant when membership is active', async () => {
    const membership = {
      id: 'm1',
      userId: 'user-1',
      tenantId: 't2',
      role: 'OWNER' as const,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    membershipService.findActiveMembership.mockResolvedValue(membership);
    prisma.tenant.findUnique.mockResolvedValue({
      id: 't2',
      name: 'Biz',
      slug: 'biz',
      type: TenantType.BUSINESS,
      status: TenantStatus.ACTIVE,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      organization: {
        id: 'org-1',
        tenantId: 't2',
        legalName: 'Biz Ltd',
        displayName: 'Biz',
        description: null,
        phone: null,
        website: null,
        logo: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    prisma.user.update.mockResolvedValue({});
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'hash',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: null,
      activeTenantId: 't2',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      roles: [
        {
          role: {
            name: 'CUSTOMER',
            permissions: [{ permission: { code: 'user.read' } }],
          },
        },
      ],
    });
    tokenService.issueTokenPair.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: '15m',
    });

    const result = await service.switchTenant('user-1', 't2');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { activeTenantId: 't2' },
    });
    expect(result.tenantContext?.tenant.id).toBe('t2');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TENANT_SWITCHED' }),
    );
  });

  it('rejects switch when membership is missing', async () => {
    membershipService.findActiveMembership.mockResolvedValue(null);
    await expect(service.switchTenant('user-1', 'missing')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects switch when tenant is inactive', async () => {
    membershipService.findActiveMembership.mockResolvedValue({
      id: 'm1',
      userId: 'user-1',
      tenantId: 't2',
      role: 'OWNER',
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.tenant.findUnique.mockResolvedValue({
      id: 't2',
      status: TenantStatus.SUSPENDED,
      organization: null,
    });

    await expect(service.switchTenant('user-1', 't2')).rejects.toBeInstanceOf(NotFoundException);
  });
});
