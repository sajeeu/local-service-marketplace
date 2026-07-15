import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  AutocompleteResponse,
  AutocompleteSuggestionDto,
  MessageResponse,
  PopularSearchesResponse,
  PricingModel,
  ProviderSearchHitDto,
  ProviderSearchResponse,
  ProviderVerificationStatus,
  PublicServiceDetailDto,
  RecentlyViewedResponse,
  ServiceSearchHitDto,
  ServiceSearchResponse,
} from '@local-service-marketplace/shared-types';
import { ServiceMediaType, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import type { AuthenticatedUser } from '../identity/interfaces/auth.interfaces';
import {
  POPULAR_SEARCHES_CACHE_KEY,
  POPULAR_SEARCHES_CACHE_TTL_SECONDS,
  PROVIDERS_INDEX,
  SERVICES_INDEX,
} from './constants';
import {
  AutocompleteQueryDto,
  PopularSearchesQueryDto,
  RecentViewsQueryDto,
  SearchProvidersQueryDto,
  SearchServicesQueryDto,
  SearchSortOption,
} from './dto/search.dto';
import { MeilisearchService } from './meilisearch.service';
import type { ProviderSearchDocument, ServiceSearchDocument } from './types/search-documents';
import { toCategoryDto } from '../services/mappers/service.mapper';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearch: MeilisearchService,
    private readonly redis: RedisService,
  ) {}

  async searchServices(query: SearchServicesQueryDto): Promise<ServiceSearchResponse> {
    this.assertGeoSort(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const q = (query.q ?? '').trim();

    const filters = this.buildServiceFilters(query);
    const sort = this.buildServiceSort(query);

    const result = await this.meilisearch.search(SERVICES_INDEX, q, {
      filter: filters.length > 0 ? filters : undefined,
      sort: sort.length > 0 ? sort : undefined,
      offset: (page - 1) * limit,
      limit,
      showRankingScore: false,
    });

    if (q.length >= 2) {
      void this.trackPopularSearch(q).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to track popular search: ${message}`);
      });
    }

    const items = result.hits.map((hit) =>
      this.toServiceHit(hit as unknown as ServiceSearchDocument, query),
    );
    return {
      items,
      meta: {
        page,
        limit,
        total: result.estimatedTotalHits ?? result.hits.length,
      },
    };
  }

  async searchByCategory(
    slug: string,
    query: SearchServicesQueryDto,
  ): Promise<ServiceSearchResponse> {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.searchServices({ ...query, category: slug });
  }

  async searchProviders(query: SearchProvidersQueryDto): Promise<ProviderSearchResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const q = (query.q ?? '').trim();
    const filters = this.buildProviderFilters(query);

    const result = await this.meilisearch.search(PROVIDERS_INDEX, q, {
      filter: filters.length > 0 ? filters : undefined,
      sort: ['averageRating:desc'],
      offset: (page - 1) * limit,
      limit,
    });

    return {
      items: result.hits.map((hit) => this.toProviderHit(hit as unknown as ProviderSearchDocument)),
      meta: {
        page,
        limit,
        total: result.estimatedTotalHits ?? result.hits.length,
      },
    };
  }

  async autocomplete(query: AutocompleteQueryDto): Promise<AutocompleteResponse> {
    const q = query.q.trim();
    const limit = query.limit ?? 8;
    const perSource = Math.max(2, Math.ceil(limit / 4));

    const [services, providers, categories, tags] = await Promise.all([
      this.meilisearch.search(SERVICES_INDEX, q, {
        limit: perSource,
        attributesToRetrieve: ['id', 'title', 'categoryName'],
      }),
      this.meilisearch.search(PROVIDERS_INDEX, q, {
        limit: perSource,
        attributesToRetrieve: ['id', 'displayName', 'cities'],
      }),
      this.prisma.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: perSource,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.serviceTag.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
          service: { status: ServiceStatus.PUBLISHED },
        },
        distinct: ['slug'],
        take: perSource,
        orderBy: { name: 'asc' },
      }),
    ]);

    const suggestions: AutocompleteSuggestionDto[] = [];

    for (const hit of services.hits) {
      suggestions.push({
        type: 'service',
        id: String(hit.id),
        label: String(hit.title ?? ''),
        subtitle: hit.categoryName ? String(hit.categoryName) : null,
      });
    }
    for (const hit of providers.hits) {
      const cities = hit.cities as string[] | undefined;
      suggestions.push({
        type: 'provider',
        id: String(hit.id),
        label: String(hit.displayName ?? ''),
        subtitle: cities?.[0] ?? null,
      });
    }
    for (const category of categories) {
      suggestions.push({
        type: 'category',
        id: category.id,
        label: category.name,
        slug: category.slug,
      });
    }
    for (const tag of tags) {
      suggestions.push({
        type: 'tag',
        id: tag.id,
        label: tag.name,
        slug: tag.slug,
      });
    }

    return { suggestions: suggestions.slice(0, limit) };
  }

  async popular(query: PopularSearchesQueryDto): Promise<PopularSearchesResponse> {
    const limit = query.limit ?? 10;
    const cacheKey = `${POPULAR_SEARCHES_CACHE_KEY}:${limit}`;

    try {
      const cached = await this.redis.getClient().get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as PopularSearchesResponse;
      }
    } catch {
      // Cache miss / redis down — continue
    }

    const rows = await this.prisma.searchQueryStat.findMany({
      orderBy: [{ count: 'desc' }, { lastSearchedAt: 'desc' }],
      take: limit,
    });

    const response: PopularSearchesResponse = {
      items: rows.map((row) => ({
        query: row.displayQuery,
        count: row.count,
      })),
    };

    try {
      await this.redis
        .getClient()
        .set(cacheKey, JSON.stringify(response), 'EX', POPULAR_SEARCHES_CACHE_TTL_SECONDS);
    } catch {
      // Ignore cache write failures
    }

    return response;
  }

  async recent(
    user: AuthenticatedUser,
    query: RecentViewsQueryDto,
  ): Promise<RecentlyViewedResponse> {
    const limit = query.limit ?? 10;
    const rows = await this.prisma.recentlyViewedService.findMany({
      where: {
        userId: user.id,
        service: { status: ServiceStatus.PUBLISHED },
      },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      include: {
        service: {
          include: {
            category: true,
            provider: true,
            media: {
              where: { type: ServiceMediaType.IMAGE },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    return {
      items: rows.map((row) => ({
        id: row.service.id,
        title: row.service.title,
        shortDescription: row.service.shortDescription,
        categoryName: row.service.category?.name ?? null,
        categorySlug: row.service.category?.slug ?? null,
        basePrice: row.service.basePrice == null ? null : Number(row.service.basePrice.toString()),
        currency: row.service.currency,
        providerDisplayName: row.service.provider.displayName,
        coverImageUrl: row.service.media[0]?.url ?? null,
        viewedAt: row.viewedAt.toISOString(),
      })),
    };
  }

  async trackView(user: AuthenticatedUser, serviceId: string): Promise<MessageResponse> {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, status: ServiceStatus.PUBLISHED },
      select: { id: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.prisma.recentlyViewedService.upsert({
      where: {
        userId_serviceId: {
          userId: user.id,
          serviceId,
        },
      },
      create: {
        userId: user.id,
        serviceId,
        viewedAt: new Date(),
      },
      update: {
        viewedAt: new Date(),
      },
    });

    return { message: 'View recorded' };
  }

  async getPublicService(serviceId: string): Promise<PublicServiceDetailDto> {
    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        status: ServiceStatus.PUBLISHED,
        provider: { isActive: true },
        category: { isActive: true },
      },
      include: {
        category: true,
        provider: true,
        media: { orderBy: { sortOrder: 'asc' } },
        tags: { orderBy: { name: 'asc' } },
        locations: true,
        faqs: { orderBy: { sortOrder: 'asc' } },
        requirements: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return {
      id: service.id,
      title: service.title,
      slug: service.slug,
      shortDescription: service.shortDescription,
      description: service.description,
      pricingModel: service.pricingModel as PricingModel,
      basePrice: service.basePrice == null ? null : Number(service.basePrice.toString()),
      currency: service.currency,
      duration: service.duration,
      instantBookingEnabled: service.instantBookingEnabled,
      featured: service.featured,
      publishedAt: service.publishedAt?.toISOString() ?? null,
      category: toCategoryDto(service.category),
      provider: {
        id: service.provider.id,
        displayName: service.provider.displayName,
        verificationStatus: service.provider.verificationStatus as ProviderVerificationStatus,
        averageRating: service.provider.averageRating,
        completedJobs: service.provider.completedJobs,
        profilePhoto: service.provider.profilePhoto,
      },
      media: service.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        altText: m.altText,
        sortOrder: m.sortOrder,
      })),
      tags: service.tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
      locations: service.locations.map((l) => ({
        id: l.id,
        type: l.type,
        city: l.city,
        state: l.state,
        country: l.country,
        latitude: l.latitude,
        longitude: l.longitude,
        serviceRadius: l.serviceRadius,
      })),
      faqs: service.faqs.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        sortOrder: f.sortOrder,
      })),
      requirements: service.requirements.map((r) => ({
        id: r.id,
        description: r.description,
        isRequired: r.isRequired,
        sortOrder: r.sortOrder,
      })),
    };
  }

  private buildServiceFilters(query: SearchServicesQueryDto): string[] {
    const filters: string[] = [];

    if (query.category) {
      filters.push(`categorySlug = "${escapeFilterValue(query.category)}"`);
    }
    if (query.city) {
      filters.push(`cities = "${escapeFilterValue(query.city)}"`);
    }
    if (query.state) {
      filters.push(`states = "${escapeFilterValue(query.state)}"`);
    }
    if (query.country) {
      filters.push(`countries = "${escapeFilterValue(query.country)}"`);
    }
    if (query.minPrice != null) {
      filters.push(`basePrice >= ${query.minPrice}`);
    }
    if (query.maxPrice != null) {
      filters.push(`basePrice <= ${query.maxPrice}`);
    }
    if (query.minRating != null) {
      filters.push(`rating >= ${query.minRating}`);
    }
    if (query.verifiedOnly) {
      filters.push('providerVerificationStatus = "VERIFIED"');
    }
    if (query.instantBooking) {
      filters.push('instantBookingEnabled = true');
    }
    if (query.tags?.length) {
      const tagFilters = query.tags.map(
        (tag) => `tags = "${escapeFilterValue(tag)}" OR tagSlugs = "${escapeFilterValue(tag)}"`,
      );
      filters.push(`(${tagFilters.join(' OR ')})`);
    }
    if (
      query.latitude != null &&
      query.longitude != null &&
      query.radius != null &&
      query.radius > 0
    ) {
      filters.push(`_geoRadius(${query.latitude}, ${query.longitude}, ${query.radius * 1000})`);
    }

    return filters;
  }

  private buildProviderFilters(query: SearchProvidersQueryDto): string[] {
    const filters: string[] = ['isActive = true'];
    if (query.city) {
      filters.push(`cities = "${escapeFilterValue(query.city)}"`);
    }
    if (query.state) {
      filters.push(`states = "${escapeFilterValue(query.state)}"`);
    }
    if (query.country) {
      filters.push(`countries = "${escapeFilterValue(query.country)}"`);
    }
    if (query.minRating != null) {
      filters.push(`averageRating >= ${query.minRating}`);
    }
    if (query.verifiedOnly) {
      filters.push('verificationStatus = "VERIFIED"');
    }
    return filters;
  }

  private buildServiceSort(query: SearchServicesQueryDto): string[] {
    switch (query.sort) {
      case SearchSortOption.NEWEST:
        return ['publishedAt:desc'];
      case SearchSortOption.PRICE_ASC:
        return ['basePrice:asc'];
      case SearchSortOption.PRICE_DESC:
        return ['basePrice:desc'];
      case SearchSortOption.RATING_DESC:
        return ['rating:desc'];
      case SearchSortOption.JOBS_DESC:
        return ['completedJobs:desc'];
      case SearchSortOption.DISTANCE:
        if (query.latitude == null || query.longitude == null) {
          throw new BadRequestException('latitude and longitude are required for distance sort');
        }
        return [`_geoPoint(${query.latitude}, ${query.longitude}):asc`];
      case SearchSortOption.RELEVANCE:
      default:
        return [];
    }
  }

  private assertGeoSort(query: SearchServicesQueryDto): void {
    if (query.sort === SearchSortOption.DISTANCE) {
      if (query.latitude == null || query.longitude == null) {
        throw new BadRequestException('latitude and longitude are required for distance sort');
      }
    }
    if (
      (query.latitude != null || query.longitude != null || query.radius != null) &&
      (query.latitude == null || query.longitude == null)
    ) {
      throw new BadRequestException('Both latitude and longitude are required for geo filtering');
    }
  }

  private toServiceHit(
    hit: ServiceSearchDocument,
    query: SearchServicesQueryDto,
  ): ServiceSearchHitDto {
    let distanceKm: number | null = null;
    if (query.latitude != null && query.longitude != null && hit._geo) {
      distanceKm = haversineKm(query.latitude, query.longitude, hit._geo.lat, hit._geo.lng);
    }

    return {
      id: hit.id,
      title: hit.title,
      shortDescription: hit.shortDescription || null,
      description: hit.description || null,
      categoryId: hit.categoryId,
      categoryName: hit.categoryName,
      categorySlug: hit.categorySlug,
      pricingModel: hit.pricingModel as PricingModel,
      basePrice: hit.basePrice,
      currency: hit.currency,
      providerId: hit.providerId,
      providerDisplayName: hit.providerDisplayName,
      providerVerificationStatus: hit.providerVerificationStatus as ProviderVerificationStatus,
      rating: hit.rating,
      completedJobs: hit.completedJobs,
      cities: hit.cities ?? [],
      states: hit.states ?? [],
      countries: hit.countries ?? [],
      latitude: hit._geo?.lat ?? null,
      longitude: hit._geo?.lng ?? null,
      serviceRadius: hit.serviceRadius,
      tags: hit.tags ?? [],
      featured: hit.featured,
      instantBookingEnabled: hit.instantBookingEnabled,
      coverImageUrl: hit.coverImageUrl,
      publishedAt: hit.publishedAt ? new Date(hit.publishedAt).toISOString() : null,
      distanceKm,
    };
  }

  private toProviderHit(hit: ProviderSearchDocument): ProviderSearchHitDto {
    return {
      id: hit.id,
      displayName: hit.displayName,
      bio: hit.bio || null,
      verificationStatus: hit.verificationStatus as ProviderVerificationStatus,
      averageRating: hit.averageRating,
      completedJobs: hit.completedJobs,
      cities: hit.cities ?? [],
      states: hit.states ?? [],
      countries: hit.countries ?? [],
      profilePhoto: hit.profilePhoto,
    };
  }

  private async trackPopularSearch(rawQuery: string): Promise<void> {
    const displayQuery = rawQuery.trim().slice(0, 200);
    const normalizedQuery = displayQuery.toLowerCase().replace(/\s+/g, ' ');
    if (normalizedQuery.length < 2) {
      return;
    }

    await this.prisma.searchQueryStat.upsert({
      where: { normalizedQuery },
      create: {
        normalizedQuery,
        displayQuery,
        count: 1,
        lastSearchedAt: new Date(),
      },
      update: {
        displayQuery,
        count: { increment: 1 },
        lastSearchedAt: new Date(),
      },
    });

    try {
      const keys = await this.redis.getClient().keys(`${POPULAR_SEARCHES_CACHE_KEY}:*`);
      if (keys.length > 0) {
        await this.redis.getClient().del(...keys);
      }
    } catch {
      // Ignore cache invalidation failures
    }
  }
}

function escapeFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
