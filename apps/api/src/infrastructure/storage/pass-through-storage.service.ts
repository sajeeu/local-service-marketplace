import { Injectable } from '@nestjs/common';
import type { StoragePort } from './storage.port';

/**
 * Development/pass-through adapter — returns the provided URL or key unchanged.
 * Replace with CloudinaryStorageService or S3StorageService in production.
 */
@Injectable()
export class PassThroughStorageService implements StoragePort {
  resolvePublicUrl(keyOrUrl: string): string {
    return keyOrUrl;
  }
}
