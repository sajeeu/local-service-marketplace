import { BadRequestException } from '@nestjs/common';
import { ProviderVerificationStatus, RoleName } from '@prisma/client';
import { AuditService } from '../../identity/services/audit.service';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import type { StoragePort } from '../interfaces/storage-port';
import { ProviderService } from './provider.service';
import { ProviderVerificationService } from './provider-verification.service';

describe('ProviderVerificationService', () => {
  const prisma = {
    providerVerification: {
      create: jest.fn(),
      update: jest.fn(),
    },
    provider: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const providerService = {
    getOrCreateMe: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  const storage: StoragePort = {
    resolvePublicUrl: (value) => value,
  };

  const service = new ProviderVerificationService(
    prisma as never,
    providerService as unknown as ProviderService,
    auditService as unknown as AuditService,
    storage,
  );

  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'provider@example.com',
    roles: [RoleName.PROVIDER],
    permissions: ['provider.verification.submit'],
    activeTenantId: 'tenant-1',
    tenantContext: null,
    tenantPermissions: [],
  };

  const admin: AuthenticatedUser = {
    ...user,
    id: 'admin-1',
    roles: [RoleName.ADMIN],
    permissions: ['provider.verification.review'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits verification and sets UNDER_REVIEW', async () => {
    providerService.getOrCreateMe.mockResolvedValue({
      id: 'provider-1',
      verificationStatus: ProviderVerificationStatus.PENDING,
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn(prisma),
    );
    prisma.provider.update.mockResolvedValue({
      id: 'provider-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      displayName: 'Alex',
      bio: null,
      profilePhoto: null,
      yearsOfExperience: 0,
      verificationStatus: ProviderVerificationStatus.UNDER_REVIEW,
      averageRating: 0,
      completedJobs: 0,
      responseRate: null,
      responseTime: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      qualifications: [],
      certifications: [],
      languages: [],
      verifications: [
        {
          id: 'ver-1',
          providerId: 'provider-1',
          status: ProviderVerificationStatus.UNDER_REVIEW,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedByUserId: null,
          rejectionReason: null,
          documentMetadata: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const result = await service.submitMine(user, {
      documents: [
        {
          filename: 'id.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
        },
      ],
    });

    expect(prisma.providerVerification.create).toHaveBeenCalled();
    expect(prisma.provider.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { verificationStatus: ProviderVerificationStatus.UNDER_REVIEW },
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROVIDER_VERIFICATION_SUBMITTED' }),
    );
    expect(result.verificationStatus).toBe('UNDER_REVIEW');
  });

  it('rejects duplicate submission while under review', async () => {
    providerService.getOrCreateMe.mockResolvedValue({
      id: 'provider-1',
      verificationStatus: ProviderVerificationStatus.UNDER_REVIEW,
    });

    await expect(
      service.submitMine(user, {
        documents: [{ filename: 'id.pdf', mimeType: 'application/pdf', sizeBytes: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('approves verification as admin and audits the decision', async () => {
    prisma.provider.findUnique.mockResolvedValue({
      id: 'provider-1',
      verifications: [
        {
          id: 'ver-1',
          status: ProviderVerificationStatus.UNDER_REVIEW,
        },
      ],
    });
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn(prisma),
    );
    prisma.provider.update.mockResolvedValue({
      id: 'provider-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      displayName: 'Alex',
      bio: null,
      profilePhoto: null,
      yearsOfExperience: 0,
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      averageRating: 0,
      completedJobs: 0,
      responseRate: null,
      responseTime: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      qualifications: [],
      certifications: [],
      languages: [],
      verifications: [],
    });

    const result = await service.review(admin, 'provider-1', { action: 'APPROVE' });

    expect(prisma.providerVerification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ProviderVerificationStatus.VERIFIED,
          reviewedByUserId: 'admin-1',
        }),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROVIDER_VERIFICATION_REVIEWED' }),
    );
    expect(result.verificationStatus).toBe('VERIFIED');
  });
});
