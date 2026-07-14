import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MembershipRole, ProviderVerificationStatus, RoleName } from '@prisma/client';
import { AuditService } from '../../identity/services/audit.service';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import type { StoragePort } from '../interfaces/storage-port';
import { ProviderService } from './provider.service';

describe('ProviderService', () => {
  const prisma = {
    provider: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    providerQualification: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    providerCertification: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    providerLanguage: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  const storage: StoragePort = {
    resolvePublicUrl: (value) => value,
  };

  const service = new ProviderService(
    prisma as never,
    auditService as unknown as AuditService,
    storage,
  );

  const providerUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'provider@example.com',
    roles: [RoleName.PROVIDER],
    permissions: ['provider.read', 'provider.manage'],
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

  const baseProvider = {
    id: 'provider-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    displayName: 'provider',
    bio: null,
    profilePhoto: null,
    yearsOfExperience: 0,
    verificationStatus: ProviderVerificationStatus.PENDING,
    averageRating: 0,
    completedJobs: 0,
    responseRate: null,
    responseTime: null,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    qualifications: [],
    certifications: [],
    languages: [],
    verifications: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a provider profile when none exists for GET me', async () => {
    prisma.provider.findUnique.mockResolvedValue(null);
    prisma.provider.create.mockResolvedValue(baseProvider);

    const result = await service.getOrCreateMe(providerUser);

    expect(prisma.provider.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          displayName: 'provider',
        }),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROVIDER_CREATED', resourceId: 'provider-1' }),
    );
    expect(result.id).toBe('provider-1');
  });

  it('updates provider profile and replaces nested professional data', async () => {
    prisma.provider.findUnique
      .mockResolvedValueOnce(baseProvider)
      .mockResolvedValueOnce(baseProvider);
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn(prisma),
    );
    prisma.provider.update.mockResolvedValue(baseProvider);
    prisma.provider.findUniqueOrThrow.mockResolvedValue({
      ...baseProvider,
      displayName: 'Alex Rivera',
      yearsOfExperience: 5,
      languages: [
        {
          id: 'lang-1',
          providerId: 'provider-1',
          code: 'en',
          label: 'English',
          proficiency: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      qualifications: [],
      certifications: [],
      verifications: [],
    });

    const result = await service.updateMe(providerUser, {
      displayName: 'Alex Rivera',
      yearsOfExperience: 5,
      languages: [{ code: 'en', label: 'English' }],
      qualifications: [],
      certifications: [],
    });

    expect(prisma.providerLanguage.deleteMany).toHaveBeenCalledWith({
      where: { providerId: 'provider-1' },
    });
    expect(prisma.providerLanguage.createMany).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROVIDER_UPDATED' }),
    );
    expect(result.displayName).toBe('Alex Rivera');
  });

  it('rejects customer access to provider domain', async () => {
    const customer: AuthenticatedUser = {
      ...providerUser,
      roles: [RoleName.CUSTOMER],
      permissions: [],
    };

    await expect(service.getOrCreateMe(customer)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects managing another tenant provider as a regular member', async () => {
    prisma.provider.findUnique.mockResolvedValue({
      ...baseProvider,
      userId: 'other-user',
    });

    const member: AuthenticatedUser = {
      ...providerUser,
      tenantContext: {
        ...providerUser.tenantContext!,
        membership: {
          ...providerUser.tenantContext!.membership,
          role: MembershipRole.MEMBER,
        },
      },
    };

    await expect(
      service.updateById(member, 'provider-1', { displayName: 'Hacked' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns public profile without private fields', async () => {
    prisma.provider.findUnique.mockResolvedValue({
      ...baseProvider,
      isActive: true,
      qualifications: [
        {
          id: 'q1',
          providerId: 'provider-1',
          title: 'NVQ',
          issuer: 'City',
          issueDate: new Date('2020-01-01'),
          expiryDate: null,
          documentUrl: 'https://secret.example/doc.pdf',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const result = await service.getPublicProfile('provider-1');

    expect(result).not.toHaveProperty('userId');
    expect(result).not.toHaveProperty('tenantId');
    expect(result.qualifications[0]).not.toHaveProperty('documentUrl');
    expect(result.qualifications[0]?.title).toBe('NVQ');
  });

  it('returns not found for inactive public profiles', async () => {
    prisma.provider.findUnique.mockResolvedValue({
      ...baseProvider,
      isActive: false,
    });

    await expect(service.getPublicProfile('provider-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validates availability times', () => {
    expect(() => service.validateAvailabilityTimes('17:00', '09:00')).toThrow(BadRequestException);
  });
});
