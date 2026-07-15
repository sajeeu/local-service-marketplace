import { Injectable } from '@nestjs/common';
import type {
  HealthCheckComponent,
  HealthCheckResult,
} from '@local-service-marketplace/shared-types';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { MeilisearchService } from '../modules/search/meilisearch.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly meilisearch: MeilisearchService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const [database, redis, meilisearch] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMeilisearch(),
    ]);

    const app: HealthCheckComponent = { status: 'up' };
    const checks = { app, database, redis, meilisearch };

    const allUp = [app, database, redis, meilisearch].every((c) => c.status === 'up');
    const anyUp = [app, database, redis, meilisearch].some((c) => c.status === 'up');

    return {
      status: allUp ? 'ok' : anyUp ? 'degraded' : 'error',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthCheckComponent> {
    const started = Date.now();
    const healthy = await this.prisma.isHealthy();
    return {
      status: healthy ? 'up' : 'down',
      latencyMs: Date.now() - started,
      ...(healthy ? {} : { message: 'Database unreachable' }),
    };
  }

  private async checkRedis(): Promise<HealthCheckComponent> {
    const started = Date.now();
    const healthy = await this.redis.ping();
    return {
      status: healthy ? 'up' : 'down',
      latencyMs: Date.now() - started,
      ...(healthy ? {} : { message: 'Redis unreachable' }),
    };
  }

  private async checkMeilisearch(): Promise<HealthCheckComponent> {
    const started = Date.now();
    const healthy = await this.meilisearch.isHealthy();
    return {
      status: healthy ? 'up' : 'down',
      latencyMs: Date.now() - started,
      ...(healthy ? {} : { message: 'Meilisearch unreachable' }),
    };
  }
}
