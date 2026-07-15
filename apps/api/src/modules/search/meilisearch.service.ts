import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/env.validation';

interface MeilisearchIndex {
  search(
    query: string,
    params?: Record<string, unknown>,
  ): Promise<{ hits: Array<Record<string, unknown>>; estimatedTotalHits?: number }>;
  addDocuments(documents: Array<Record<string, unknown>>): Promise<unknown>;
  deleteDocument(documentId: string): Promise<unknown>;
  deleteAllDocuments(): Promise<unknown>;
  updateSettings(settings: Record<string, unknown>): Promise<unknown>;
}

interface MeilisearchClient {
  index(uid: string): MeilisearchIndex;
  health(): Promise<{ status: string }>;
  getIndex(uid: string): Promise<unknown>;
  createIndex(uid: string, options?: { primaryKey?: string }): Promise<unknown>;
}

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private client!: MeilisearchClient;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get('MEILISEARCH_HOST', { infer: true });
    const apiKey = this.configService.get('MEILISEARCH_API_KEY', { infer: true });
    // Meilisearch JS client is ESM-only; Nest loads it dynamically at runtime.
    // @ts-expect-error -- package exports are ESM; moduleResolution cannot resolve types here
    const mod = await import('meilisearch');
    const MeilisearchCtor =
      (mod as { Meilisearch?: new (o: { host: string; apiKey: string }) => MeilisearchClient })
        .Meilisearch ??
      (mod as { MeiliSearch?: new (o: { host: string; apiKey: string }) => MeilisearchClient })
        .MeiliSearch ??
      (mod as { default?: new (o: { host: string; apiKey: string }) => MeilisearchClient }).default;
    if (!MeilisearchCtor) {
      throw new Error('Unable to load Meilisearch client constructor');
    }
    this.client = new MeilisearchCtor({ host, apiKey });
    this.logger.log(`Meilisearch client configured for ${host}`);
  }

  getClient(): MeilisearchClient {
    return this.client;
  }

  index(uid: string): MeilisearchIndex {
    return this.client.index(uid);
  }

  async search(
    indexUid: string,
    query: string,
    params?: Record<string, unknown>,
  ): Promise<{ hits: Array<Record<string, unknown>>; estimatedTotalHits?: number }> {
    return this.client.index(indexUid).search(query, params);
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      const health = await this.client.health();
      return health.status === 'available';
    } catch {
      return false;
    }
  }
}
