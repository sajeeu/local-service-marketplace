import { ForbiddenException } from '@nestjs/common';
import { MembershipStatus, TenantStatus, TenantType } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  const prisma = {
    membership: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const service = new TenantContextService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves tenant context for an active membership', async () => {
    prisma.membership.findUnique.mockResolvedValue({
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
    });

    const result = await service.resolve({
      userId: 'user-1',
      headerTenantId: 't1',
      jwtTenantId: null,
      storedTenantId: null,
    });

    expect(result?.tenant.id).toBe('t1');
    expect(result?.permissions).toContain('tenant.read');
  });

  it('rejects invalid header tenant without falling back', async () => {
    prisma.membership.findUnique.mockResolvedValue(null);

    await expect(
      service.resolve({
        userId: 'user-1',
        headerTenantId: 'evil-tenant',
        jwtTenantId: 't1',
        storedTenantId: 't1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
