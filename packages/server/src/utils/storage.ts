import path from 'path';

export function getStorageBasePath(): string {
  return process.env.STORAGE_PATH || './storage';
}

export function getImagePath(hash: string): string {
  const prefix = hash.substring(0, 2);
  return path.join(getStorageBasePath(), 'images', prefix, hash);
}

export function getThumbnailPath(hash: string): string {
  const prefix = hash.substring(0, 2);
  return path.join(getStorageBasePath(), 'thumbnails', prefix, hash);
}
