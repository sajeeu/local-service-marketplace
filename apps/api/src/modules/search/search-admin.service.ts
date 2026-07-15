import { Injectable, Logger } from '@nestjs/common';
import type { SearchReindexResult } from '@local-service-marketplace/shared-types';
import { ProviderSearchIndexer } from './indexers/provider-search.indexer';
import { ServiceSearchIndexer } from './indexers/service-search.indexer';
import { SearchIndexBootstrapService } from './search-index-bootstrap.service';

@Injectable()
export class SearchAdminService {
  private readonly logger = new Logger(SearchAdminService.name);

  constructor(
    private readonly serviceIndexer: ServiceSearchIndexer,
    private readonly providerIndexer: ProviderSearchIndexer,
    private readonly bootstrap: SearchIndexBootstrapService,
  ) {}

  async reindexAll(): Promise<SearchReindexResult> {
    this.logger.log('Starting full search reindex');
    await this.bootstrap.onModuleInit();
    const [servicesIndexed, providersIndexed] = await Promise.all([
      this.serviceIndexer.reindexAll(),
      this.providerIndexer.reindexAll(),
    ]);
    this.logger.log(`Reindex complete: ${servicesIndexed} services, ${providersIndexed} providers`);
    return { servicesIndexed, providersIndexed };
  }
}
