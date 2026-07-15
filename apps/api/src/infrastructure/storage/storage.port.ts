export const STORAGE_PORT = Symbol('STORAGE_PORT');

/**
 * Abstraction for object storage (AWS S3 / Cloudinary).
 * Callers pass URLs or storage keys; concrete adapters resolve public URLs.
 * Upload/sign flows will be wired when media providers are connected.
 */
export interface StoragePort {
  resolvePublicUrl(keyOrUrl: string): string;
}
