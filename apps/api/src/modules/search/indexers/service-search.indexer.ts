import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { MeilisearchService } from '../meilisearch.service';
import { SERVICES_INDEX } from '../constants';
import type { ServiceSearchDocument } from '../types/search-documents';

const INDEX_INCLUDE = {
  category: true,
  provider: true,
  tags: true,
  locations: true,
  media: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
} satisfies Prisma.ServiceInclude;

type ServiceForIndex = Prisma.ServiceGetPayload<{ include: typeof INDEX_INCLUDE }>;

@Injectable()
export class ServiceSearchIndexer {
  private readonly logger = new Logger(ServiceSearchIndexer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearch: MeilisearchService,
  ) {}

  async upsertById(serviceId: string): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: INDEX_INCLUDE,
    });

    if (!service || !this.isIndexable(service)) {
      await this.remove(serviceId);
      return;
    }

    await this.upsertDocument(this.toDocument(service));
  }

  async remove(serviceId: string): Promise<void> {
    try {
      await this.meilisearch.index(SERVICES_INDEX).deleteDocument(serviceId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to remove service ${serviceId} from index: ${message}`);
    }
  }

  async reindexAll(): Promise<number> {
    const services = await this.prisma.service.findMany({
      where: {
        status: ServiceStatus.PUBLISHED,
        provider: { isActive: true },
      },
      include: INDEX_INCLUDE,
    });

    const documents = services.filter((s) => this.isIndexable(s)).map((s) => this.toDocument(s));
    const index = this.meilisearch.index(SERVICES_INDEX);
    await index.deleteAllDocuments();
    if (documents.length > 0) {
      await index.addDocuments(documents as unknown as Array<Record<string, unknown>>);
    }
    return documents.length;
  }

  async reindexByCategoryId(categoryId: string): Promise<void> {
    const services = await this.prisma.service.findMany({
      where: { categoryId },
      select: { id: true },
    });
    for (const service of services) {
      await this.upsertById(service.id);
    }
  }

  async reindexByProviderId(providerId: string): Promise<void> {
    const services = await this.prisma.service.findMany({
      where: { providerId },
      select: { id: true },
    });
    for (const service of services) {
      await this.upsertById(service.id);
    }
  }

  toDocument(service: ServiceForIndex): ServiceSearchDocument {
    const cities = uniqueStrings(service.locations.map((l) => l.city));
    const states = uniqueStrings(service.locations.map((l) => l.state));
    const countries = uniqueStrings(service.locations.map((l) => l.country));
    const geoLocation = service.locations.find((l) => l.latitude != null && l.longitude != null);
    const radiusLocation = service.locations.find((l) => l.serviceRadius != null);
    const cover = service.media[0];

    const doc: ServiceSearchDocument = {
      id: service.id,
      title: service.title,
      description: service.description ?? '',
      shortDescription: service.shortDescription ?? '',
      categoryId: service.categoryId,
      categoryName: service.category.name,
      categorySlug: service.category.slug,
      pricingModel: service.pricingModel,
      basePrice: service.basePrice == null ? null : Number(service.basePrice.toString()),
      currency: service.currency,
      providerId: service.providerId,
      providerDisplayName: service.provider.displayName,
      providerVerificationStatus: service.provider.verificationStatus,
      rating: service.provider.averageRating,
      completedJobs: service.provider.completedJobs,
      cities,
      states,
      countries,
      serviceRadius: radiusLocation?.serviceRadius ?? null,
      tags: service.tags.map((t) => t.name),
      tagSlugs: service.tags.map((t) => t.slug),
      featured: service.featured,
      instantBookingEnabled: service.instantBookingEnabled,
      createdAt: service.createdAt.getTime(),
      publishedAt: service.publishedAt?.getTime() ?? null,
      coverImageUrl: cover?.url ?? null,
    };

    if (geoLocation?.latitude != null && geoLocation.longitude != null) {
      doc._geo = { lat: geoLocation.latitude, lng: geoLocation.longitude };
    }

    return doc;
  }

  isIndexable(service: ServiceForIndex): boolean {
    return (
      service.status === ServiceStatus.PUBLISHED &&
      service.provider.isActive &&
      service.category.isActive
    );
  }

  private async upsertDocument(document: ServiceSearchDocument): Promise<void> {
    await this.meilisearch
      .index(SERVICES_INDEX)
      .addDocuments([document as unknown as Record<string, unknown>]);
  }
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))];
}
