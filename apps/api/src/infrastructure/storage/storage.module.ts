import { Global, Module } from '@nestjs/common';
import { PassThroughStorageService } from './pass-through-storage.service';
import { STORAGE_PORT } from './storage.port';

@Global()
@Module({
  providers: [
    PassThroughStorageService,
    {
      provide: STORAGE_PORT,
      useExisting: PassThroughStorageService,
    },
  ],
  exports: [STORAGE_PORT, PassThroughStorageService],
})
export class StorageModule {}
