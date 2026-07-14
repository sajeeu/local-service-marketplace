import { NotFoundException } from '@nestjs/common';
import { MembershipRole, RoleName } from '@prisma/client';
import { AuditService } from '../../identity/services/audit.service';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import { ProviderAvailabilityService } from './provider-availability.service';
import { ProviderService } from './provider.service';

describe('ProviderAvailabilityService', () => {
  const prisma = {
    providerAvailability: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const providerService = {
    getOrCreateMe: jest.fn(),
    assertAvailabilityDto: jest.fn(),
    validateAvailabilityTimes: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  const service = new ProviderAvailabilityService(
    prisma as never,
    providerService as unknown as ProviderService,
    auditService as unknown as AuditService,
  );

  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'provider@example.com',
    roles: [RoleName.PROVIDER],
    permissions: ['provider.manage'],
    activeTenantId: 'tenant-1',
    tenantContext: {
      tenant: {
        id: 'tenant-1',
        name: 'Workspace',
        slug: 'workspace',
        type: 'INDIVIDUAL',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      organization: null,
      membership: {
        id: 'm1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        role: MembershipRole.OWNER,
        status: 'ACTIVE',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
      permissions: [],
    },
    tenantPermissions: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    providerService.getOrCreateMe.mockResolvedValue({ id: 'provider-1' });
  });

  it('creates an availability slot', async () => {
    prisma.providerAvailability.create.mockResolvedValue({
      id: 'slot-1',
      providerId: 'provider-1',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'Europe/London',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createMine(user, {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'Europe/London',
    });

    expect(providerService.assertAvailabilityDto).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROVIDER_AVAILABILITY_CREATED' }),
    );
    expect(result.id).toBe('slot-1');
  });

  it('lists availability for the authenticated provider', async () => {
    prisma.providerAvailability.findMany.mockResolvedValue([
      {
        id: 'slot-1',
        providerId: 'provider-1',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.listMine(user);
    expect(result).toHaveLength(1);
    expect(result[0]?.dayOfWeek).toBe(1);
  });

  it('rejects update for another provider slot', async () => {
    prisma.providerAvailability.findUnique.mockResolvedValue({
      id: 'slot-1',
      providerId: 'other-provider',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'UTC',
    });

    await expect(service.updateMine(user, 'slot-1', { startTime: '10:00' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes an owned availability slot', async () => {
    prisma.providerAvailability.findUnique.mockResolvedValue({
      id: 'slot-1',
      providerId: 'provider-1',
    });

    const result = await service.deleteMine(user, 'slot-1');
    expect(prisma.providerAvailability.delete).toHaveBeenCalledWith({ where: { id: 'slot-1' } });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROVIDER_AVAILABILITY_DELETED' }),
    );
    expect(result.message).toContain('deleted');
  });
});
