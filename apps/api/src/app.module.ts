import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    IdentityModule,
    TenancyModule,
    ProvidersModule,
  ],
})
export class AppModule {}
