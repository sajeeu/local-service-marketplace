import { Injectable } from '@nestjs/common';
import type { StoragePort } from '../interfaces/storage-port';

@Injectable()
export class PassThroughStorageService implements StoragePort {
  resolvePublicUrl(keyOrUrl: string): string {
    return keyOrUrl;
  }
}
