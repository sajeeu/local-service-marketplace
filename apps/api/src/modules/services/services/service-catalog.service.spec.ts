import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  MembershipRole,
  PricingModel,
  ProviderVerificationStatus,
  RoleName,
  ServiceStatus,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../identity/interfaces/auth.interfaces';
import { ServiceCatalogService } from './service-catalog.service';

function buildUser(overrides?: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 'user-1',
    email: 'provider@example.com',
    roles: [RoleName.PROVIDER],
    permissions: ['service.read', 'service.manage'],
    activeTenantId: 'tenant-1',
    tenantContext: {
      tenant: {
        id: 'tenant-1',
        name: 'Provider Tenant',
        slug: 'provider-tenant',
        type: 'INDIVIDUAL',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      organization: null,
      membership: {
        id: 'membership-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        role: MembershipRole.OWNER,
        status: 'ACTIVE',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
      permissions: [],
    },
    tenantPermissions: [],
    ...overrides,
  };
}

describe('ServiceCatalogService', () => {
  const prisma = {
    provider: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    serviceMedia: { count: jest.fn(), create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
    serviceTag: { count: jest.fn(), create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
    serviceFaq: { count: jest.fn(), create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
    serviceRequirement: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    serviceLocation: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const auditService = { log: jest.fn() };
  const categoryService = {
    assertActiveCategory: jest.fn().mockResolvedValue({ id: 'cat-1' }),
  };
  const eventEmitter = { emit: jest.fn() };
  const storage = { resolvePublicUrl: (value: string) => value };

  const service = new ServiceCatalogService(
    prisma as never,
    auditService as never,
    categoryService as never,
    eventEmitter as never,
    storage,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const provider = {
    id: 'provider-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    verificationStatus: ProviderVerificationStatus.VERIFIED,
  };

  const draftService = {
    id: 'service-1',
    providerId: 'provider-1',
    categoryId: 'cat-1',
    title: 'Emergency Plumbing',
    slug: 'emergency-plumbing',
    shortDescription: 'Fast help',
    description: 'Detailed description for publishing a plumbing service.',
    status: ServiceStatus.DRAFT,
    pricingModel: PricingModel.FIXED,
    basePrice: { toString: () => '95' },
    currency: 'USD',
    duration: 60,
    cancellationPolicy: null,
    instantBookingEnabled: false,
    featured: false,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-1',
      parentId: null,
      name: 'Plumbing',
      slug: 'plumbing',
      description: null,
      icon: null,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    media: [],
    tags: [],
    locations: [
      {
        id: 'loc-1',
        serviceId: 'service-1',
        type: 'ON_SITE',
        city: 'Austin',
        state: 'TX',
        country: 'US',
        latitude: null,
        longitude: null,
        serviceRadius: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    faqs: [],
    requirements: [],
    provider,
  };

  it('creates a draft service for the authenticated provider', async () => {
    prisma.provider.findUnique.mockResolvedValue(provider);
    prisma.service.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        service: {
          create: jest.fn().mockResolvedValue({ id: 'service-1' }),
          findUniqueOrThrow: jest.fn().mockResolvedValue(draftService),
        },
        serviceTag: { deleteMany: jest.fn(), createMany: jest.fn() },
        serviceLocation: { deleteMany: jest.fn(), createMany: jest.fn() },
        serviceFaq: { deleteMany: jest.fn(), createMany: jest.fn() },
        serviceRequirement: { deleteMany: jest.fn(), createMany: jest.fn() },
        serviceMedia: { deleteMany: jest.fn(), createMany: jest.fn() },
      };
      return callback(tx);
    });

    const result = await service.create(buildUser(), {
      categoryId: 'cat-1',
      title: 'Emergency Plumbing',
      pricingModel: PricingModel.FIXED,
      basePrice: 95,
      duration: 60,
      locations: [{ type: 'ON_SITE' as never, city: 'Austin', country: 'US' }],
    });

    expect(result.title).toBe('Emergency Plumbing');
    expect(result.status).toBe('DRAFT');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SERVICE_CREATED' }),
    );
  });

  it('rejects publishing when provider is not verified', async () => {
    prisma.service.findUnique.mockResolvedValue(draftService);
    prisma.service.count.mockResolvedValue(1);
    prisma.provider.findUnique.mockResolvedValue({
      ...provider,
      verificationStatus: ProviderVerificationStatus.PENDING,
    });

    await expect(service.publish(buildUser(), 'service-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('publishes when provider is verified and required fields are complete', async () => {
    prisma.service.findUnique.mockResolvedValue(draftService);
    prisma.service.count.mockResolvedValue(1);
    prisma.provider.findUnique.mockResolvedValue(provider);
    prisma.service.update.mockResolvedValue({
      ...draftService,
      status: ServiceStatus.PUBLISHED,
      publishedAt: new Date(),
    });

    const result = await service.publish(buildUser(), 'service-1');
    expect(result.status).toBe('PUBLISHED');
  });

  it('rejects publish when description is missing', async () => {
    prisma.service.findUnique.mockResolvedValue({
      ...draftService,
      description: 'short',
    });
    prisma.service.count.mockResolvedValue(1);
    prisma.provider.findUnique.mockResolvedValue(provider);

    await expect(service.publish(buildUser(), 'service-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('prevents providers from managing another provider service', async () => {
    prisma.service.findUnique.mockResolvedValue({
      ...draftService,
      provider: { ...provider, userId: 'other-user' },
    });

    await expect(
      service.update(buildUser(), 'service-1', { title: 'Updated' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects invalid pricing without base price', async () => {
    prisma.provider.findUnique.mockResolvedValue(provider);

    await expect(
      service.create(buildUser(), {
        categoryId: 'cat-1',
        title: 'No price',
        pricingModel: PricingModel.HOURLY,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns not found for services outside the tenant', async () => {
    prisma.service.findUnique.mockResolvedValue({
      ...draftService,
      provider: { ...provider, tenantId: 'other-tenant' },
    });

    await expect(service.getById(buildUser(), 'service-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
