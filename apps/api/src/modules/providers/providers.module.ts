import { Module, forwardRef } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { AdminProvidersController } from './controllers/admin-providers.controller';
import { ProviderAvailabilityController } from './controllers/provider-availability.controller';
import { ProviderVerificationController } from './controllers/provider-verification.controller';
import { ProvidersController } from './controllers/providers.controller';
import { PublicProvidersController } from './controllers/public-providers.controller';
import { STORAGE_PORT } from './interfaces/storage-port';
import { PassThroughStorageService } from './services/pass-through-storage.service';
import { ProviderAvailabilityService } from './services/provider-availability.service';
import { ProviderVerificationService } from './services/provider-verification.service';
import { ProviderService } from './services/provider.service';

@Module({
  imports: [forwardRef(() => IdentityModule), TenancyModule],
  controllers: [
    ProvidersController,
    ProviderAvailabilityController,
    ProviderVerificationController,
    PublicProvidersController,
    AdminProvidersController,
  ],
  providers: [
    ProviderService,
    ProviderAvailabilityService,
    ProviderVerificationService,
    PassThroughStorageService,
    {
      provide: STORAGE_PORT,
      useExisting: PassThroughStorageService,
    },
  ],
  exports: [ProviderService, ProviderAvailabilityService, ProviderVerificationService],
})
export class ProvidersModule {}
