export const STORAGE_PORT = Symbol('STORAGE_PORT');

/**
 * Abstraction for object storage (S3 / Cloudinary).
 * Phase 3 accepts caller-provided URLs; upload will be wired later.
 */
export interface StoragePort {
  resolvePublicUrl(keyOrUrl: string): string;
}
