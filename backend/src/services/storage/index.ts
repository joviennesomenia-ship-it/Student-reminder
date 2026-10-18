import { env } from '../../config/env.js';
import { CloudinaryStorage } from './cloudinary.js';
import { LocalStorage } from './local.js';
import type { StorageDriver } from './types.js';

let driver: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (driver) return driver;
  switch (env.STORAGE_DRIVER) {
    case 'local':
      driver = new LocalStorage();
      break;
    case 'cloudinary':
      driver = new CloudinaryStorage();
      break;
    default:
      throw new Error(`STORAGE_DRIVER "${env.STORAGE_DRIVER}" is not implemented yet. Use "local" or "cloudinary".`);
  }
  return driver;
}
