import { ServiceStatus } from '@prisma/client';
import { ServiceSearchIndexer } from './service-search.indexer';
import type { ServiceSearchDocument } from '../types/search-documents';

describe('ServiceSearchIndexer', () => {
  const meilisearch = {
    index: jest.fn().mockReturnValue({
      addDocuments: jest.fn().mockResolvedValue(undefined),
      deleteDocument: jest.fn().mockResolvedValue(undefined),
      deleteAllDocuments: jest.fn().mockResolvedValue(undefined),
    }),
  };

  const prisma = {
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const indexer = new ServiceSearchIndexer(prisma as never, meilisearch as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const publishedService = {
    id: 'service-1',
    title: 'Emergency Plumbing',
    description: 'Fast pipe repairs',
    shortDescription: 'Fast help',
    categoryId: 'cat-1',
    pricingModel: 'FIXED',
    basePrice: { toString: () => '95' },
    currency: 'USD',
    providerId: 'provider-1',
    featured: true,
    instantBookingEnabled: false,
    status: ServiceStatus.PUBLISHED,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    publishedAt: new Date('2026-01-02T00:00:00.000Z'),
    category: {
      id: 'cat-1',
      name: 'Plumbing',
      slug: 'plumbing',
      isActive: true,
    },
    provider: {
      id: 'provider-1',
      displayName: 'Ace Plumbing',
      verificationStatus: 'VERIFIED',
      averageRating: 4.8,
      completedJobs: 120,
      isActive: true,
    },
    tags: [{ name: 'Emergency', slug: 'emergency' }],
    locations: [
      {
        city: 'Austin',
        state: 'TX',
        country: 'US',
        latitude: 30.27,
        longitude: -97.74,
        serviceRadius: 25,
      },
    ],
    media: [{ url: 'https://cdn.example.com/cover.jpg' }],
  };

  it('indexes published active services with geo and provider trust fields', () => {
    const doc = indexer.toDocument(publishedService as never);
    expect(doc.id).toBe('service-1');
    expect(doc.providerDisplayName).toBe('Ace Plumbing');
    expect(doc.rating).toBe(4.8);
    expect(doc.cities).toEqual(['Austin']);
    expect(doc._geo).toEqual({ lat: 30.27, lng: -97.74 });
    expect(doc.tags).toEqual(['Emergency']);
    expect(doc.coverImageUrl).toBe('https://cdn.example.com/cover.jpg');
  });

  it('treats draft services as not indexable', () => {
    expect(
      indexer.isIndexable({
        ...publishedService,
        status: ServiceStatus.DRAFT,
      } as never),
    ).toBe(false);
  });

  it('removes non-indexable services on upsert', async () => {
    prisma.service.findUnique.mockResolvedValue({
      ...publishedService,
      status: ServiceStatus.PAUSED,
    });

    await indexer.upsertById('service-1');

    expect(meilisearch.index().deleteDocument).toHaveBeenCalledWith('service-1');
    expect(meilisearch.index().addDocuments).not.toHaveBeenCalled();
  });

  it('upserts indexable services', async () => {
    prisma.service.findUnique.mockResolvedValue(publishedService);

    await indexer.upsertById('service-1');

    expect(meilisearch.index().addDocuments).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'service-1',
        title: 'Emergency Plumbing',
      } satisfies Partial<ServiceSearchDocument>),
    ]);
  });
});
