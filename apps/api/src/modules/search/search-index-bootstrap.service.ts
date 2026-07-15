import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MeilisearchService } from './meilisearch.service';
import { PROVIDERS_INDEX, SERVICES_INDEX } from './constants';

@Injectable()
export class SearchIndexBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(SearchIndexBootstrapService.name);

  constructor(private readonly meilisearch: MeilisearchService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureServicesIndex();
      await this.ensureProvidersIndex();
      this.logger.log('Meilisearch indexes ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to bootstrap Meilisearch indexes: ${message}`);
    }
  }

  private async ensureServicesIndex(): Promise<void> {
    const client = this.meilisearch.getClient();
    try {
      await client.getIndex(SERVICES_INDEX);
    } catch {
      await client.createIndex(SERVICES_INDEX, { primaryKey: 'id' });
    }

    const index = this.meilisearch.index(SERVICES_INDEX);
    await index.updateSettings({
      searchableAttributes: [
        'title',
        'description',
        'shortDescription',
        'providerDisplayName',
        'tags',
        'categoryName',
        'cities',
      ],
      filterableAttributes: [
        'categorySlug',
        'categoryId',
        'cities',
        'states',
        'countries',
        'basePrice',
        'rating',
        'providerVerificationStatus',
        'instantBookingEnabled',
        'featured',
        'tags',
        'tagSlugs',
        '_geo',
      ],
      sortableAttributes: ['publishedAt', 'createdAt', 'basePrice', 'rating', 'completedJobs'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'featured:desc',
      ],
    });
  }

  private async ensureProvidersIndex(): Promise<void> {
    const client = this.meilisearch.getClient();
    try {
      await client.getIndex(PROVIDERS_INDEX);
    } catch {
      await client.createIndex(PROVIDERS_INDEX, { primaryKey: 'id' });
    }

    const index = this.meilisearch.index(PROVIDERS_INDEX);
    await index.updateSettings({
      searchableAttributes: ['displayName', 'bio', 'cities'],
      filterableAttributes: [
        'verificationStatus',
        'averageRating',
        'cities',
        'states',
        'countries',
        'isActive',
      ],
      sortableAttributes: ['averageRating', 'completedJobs', 'createdAt'],
    });
  }
}
