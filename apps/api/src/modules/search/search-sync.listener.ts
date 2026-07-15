import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SEARCH_EVENTS } from './constants';
import { ProviderSearchIndexer } from './indexers/provider-search.indexer';
import { ServiceSearchIndexer } from './indexers/service-search.indexer';

@Injectable()
export class SearchSyncListener {
  private readonly logger = new Logger(SearchSyncListener.name);

  constructor(
    private readonly serviceIndexer: ServiceSearchIndexer,
    private readonly providerIndexer: ProviderSearchIndexer,
  ) {}

  @OnEvent(SEARCH_EVENTS.SERVICE_UPSERT, { async: true })
  async handleServiceUpsert(payload: { serviceId: string }): Promise<void> {
    try {
      await this.serviceIndexer.upsertById(payload.serviceId);
    } catch (error) {
      this.logError('service upsert', payload.serviceId, error);
    }
  }

  @OnEvent(SEARCH_EVENTS.SERVICE_REMOVE, { async: true })
  async handleServiceRemove(payload: { serviceId: string }): Promise<void> {
    try {
      await this.serviceIndexer.remove(payload.serviceId);
    } catch (error) {
      this.logError('service remove', payload.serviceId, error);
    }
  }

  @OnEvent(SEARCH_EVENTS.PROVIDER_UPSERT, { async: true })
  async handleProviderUpsert(payload: { providerId: string }): Promise<void> {
    try {
      await this.providerIndexer.upsertById(payload.providerId);
      await this.serviceIndexer.reindexByProviderId(payload.providerId);
    } catch (error) {
      this.logError('provider upsert', payload.providerId, error);
    }
  }

  @OnEvent(SEARCH_EVENTS.CATEGORY_UPDATED, { async: true })
  async handleCategoryUpdated(payload: { categoryId: string }): Promise<void> {
    try {
      await this.serviceIndexer.reindexByCategoryId(payload.categoryId);
    } catch (error) {
      this.logError('category update', payload.categoryId, error);
    }
  }

  private logError(action: string, id: string, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Search sync failed (${action}) for ${id}: ${message}`);
  }
}
