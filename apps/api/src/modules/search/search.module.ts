import { Module } from '@nestjs/common';
import { AdminSearchController, SearchController } from './controllers/search.controller';
import { ProviderSearchIndexer } from './indexers/provider-search.indexer';
import { ServiceSearchIndexer } from './indexers/service-search.indexer';
import { MeilisearchService } from './meilisearch.service';
import { SearchAdminService } from './search-admin.service';
import { SearchIndexBootstrapService } from './search-index-bootstrap.service';
import { SearchSyncListener } from './search-sync.listener';
import { SearchService } from './search.service';

@Module({
  controllers: [SearchController, AdminSearchController],
  providers: [
    MeilisearchService,
    SearchIndexBootstrapService,
    ServiceSearchIndexer,
    ProviderSearchIndexer,
    SearchSyncListener,
    SearchService,
    SearchAdminService,
  ],
  exports: [MeilisearchService, ServiceSearchIndexer, ProviderSearchIndexer],
})
export class SearchModule {}
