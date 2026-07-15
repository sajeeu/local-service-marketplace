import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SearchSortOption } from './dto/search.dto';
import { SearchService } from './search.service';

describe('SearchService', () => {
  const prisma = {
    category: { findFirst: jest.fn(), findMany: jest.fn() },
    serviceTag: { findMany: jest.fn() },
    searchQueryStat: { findMany: jest.fn(), upsert: jest.fn() },
    recentlyViewedService: { findMany: jest.fn(), upsert: jest.fn() },
    service: { findFirst: jest.fn() },
  };

  const meilisearch = {
    search: jest.fn(),
  };

  const redis = {
    getClient: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(0),
    }),
  };

  const service = new SearchService(prisma as never, meilisearch as never, redis as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches services and maps hits with distance when geo is provided', async () => {
    meilisearch.search.mockResolvedValue({
      hits: [
        {
          id: 'service-1',
          title: 'Plumbing',
          shortDescription: 'Help',
          description: 'Desc',
          categoryId: 'cat-1',
          categoryName: 'Plumbing',
          categorySlug: 'plumbing',
          pricingModel: 'FIXED',
          basePrice: 100,
          currency: 'USD',
          providerId: 'provider-1',
          providerDisplayName: 'Ace',
          providerVerificationStatus: 'VERIFIED',
          rating: 4.5,
          completedJobs: 10,
          cities: ['Austin'],
          states: ['TX'],
          countries: ['US'],
          _geo: { lat: 30.27, lng: -97.74 },
          serviceRadius: 20,
          tags: [],
          featured: false,
          instantBookingEnabled: false,
          coverImageUrl: null,
          publishedAt: Date.now(),
        },
      ],
      estimatedTotalHits: 1,
    });

    const result = await service.searchServices({
      q: 'plumb',
      page: 1,
      limit: 20,
      latitude: 30.25,
      longitude: -97.75,
      sort: SearchSortOption.RELEVANCE,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.distanceKm).not.toBeNull();
    expect(result.meta.total).toBe(1);
    expect(prisma.searchQueryStat.upsert).toHaveBeenCalled();
  });

  it('rejects distance sort without coordinates', async () => {
    await expect(
      service.searchServices({
        sort: SearchSortOption.DISTANCE,
        page: 1,
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when category slug is missing', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    await expect(
      service.searchByCategory('missing', { page: 1, limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('limits autocomplete suggestions', async () => {
    meilisearch.search
      .mockResolvedValueOnce({
        hits: [{ id: 's1', title: 'Service A', categoryName: 'Plumbing' }],
      })
      .mockResolvedValueOnce({
        hits: [{ id: 'p1', displayName: 'Provider A', cities: ['Austin'] }],
      });
    prisma.category.findMany.mockResolvedValue([{ id: 'c1', name: 'Plumbing', slug: 'plumbing' }]);
    prisma.serviceTag.findMany.mockResolvedValue([
      { id: 't1', name: 'Emergency', slug: 'emergency' },
    ]);

    const result = await service.autocomplete({ q: 'pl', limit: 3 });
    expect(result.suggestions.length).toBeLessThanOrEqual(3);
  });

  it('tracks recently viewed published services only', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 'service-1' });
    prisma.recentlyViewedService.upsert.mockResolvedValue({});

    const result = await service.trackView({ id: 'user-1' } as never, 'service-1');

    expect(result.message).toBe('View recorded');
    expect(prisma.recentlyViewedService.upsert).toHaveBeenCalled();
  });

  it('rejects views for unpublished services', async () => {
    prisma.service.findFirst.mockResolvedValue(null);
    await expect(service.trackView({ id: 'user-1' } as never, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
