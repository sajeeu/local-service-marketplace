import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { MeilisearchService } from '../meilisearch.service';
import { PROVIDERS_INDEX } from '../constants';
import type { ProviderSearchDocument } from '../types/search-documents';

const PROVIDER_INCLUDE = {
  services: {
    where: { status: ServiceStatus.PUBLISHED },
    include: { locations: true },
  },
} satisfies Prisma.ProviderInclude;

type ProviderForIndex = Prisma.ProviderGetPayload<{ include: typeof PROVIDER_INCLUDE }>;

@Injectable()
export class ProviderSearchIndexer {
  private readonly logger = new Logger(ProviderSearchIndexer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearch: MeilisearchService,
  ) {}

  async upsertById(providerId: string): Promise<void> {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: PROVIDER_INCLUDE,
    });

    if (!provider || !provider.isActive) {
      await this.remove(providerId);
      return;
    }

    await this.upsertDocument(this.toDocument(provider));
  }

  async remove(providerId: string): Promise<void> {
    try {
      await this.meilisearch.index(PROVIDERS_INDEX).deleteDocument(providerId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to remove provider ${providerId} from index: ${message}`);
    }
  }

  async reindexAll(): Promise<number> {
    const providers = await this.prisma.provider.findMany({
      where: { isActive: true },
      include: PROVIDER_INCLUDE,
    });

    const documents = providers.map((p) => this.toDocument(p));
    const index = this.meilisearch.index(PROVIDERS_INDEX);
    await index.deleteAllDocuments();
    if (documents.length > 0) {
      await index.addDocuments(documents as unknown as Array<Record<string, unknown>>);
    }
    return documents.length;
  }

  toDocument(provider: ProviderForIndex): ProviderSearchDocument {
    const cities = new Set<string>();
    const states = new Set<string>();
    const countries = new Set<string>();

    for (const service of provider.services) {
      for (const location of service.locations) {
        if (location.city) cities.add(location.city);
        if (location.state) states.add(location.state);
        if (location.country) countries.add(location.country);
      }
    }

    return {
      id: provider.id,
      displayName: provider.displayName,
      bio: provider.bio ?? '',
      verificationStatus: provider.verificationStatus,
      averageRating: provider.averageRating,
      completedJobs: provider.completedJobs,
      isActive: provider.isActive,
      cities: [...cities],
      states: [...states],
      countries: [...countries],
      profilePhoto: provider.profilePhoto,
      createdAt: provider.createdAt.getTime(),
    };
  }

  private async upsertDocument(document: ProviderSearchDocument): Promise<void> {
    await this.meilisearch
      .index(PROVIDERS_INDEX)
      .addDocuments([document as unknown as Record<string, unknown>]);
  }
}
