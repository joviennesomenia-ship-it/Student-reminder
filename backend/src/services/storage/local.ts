import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';
import type { StorageDriver, StoredFile, UploadInput } from './types.js';

export const uploadDir = path.resolve(env.UPLOAD_DIR);

export class LocalStorage implements StorageDriver {
  async save(file: UploadInput): Promise<StoredFile> {
    await mkdir(uploadDir, { recursive: true });
    const key = `${randomUUID()}${file.extension}`; // never use the client's file name on disk
    await writeFile(path.join(uploadDir, key), file.buffer);
    return { key, url: `${env.PUBLIC_BASE_URL.replace(/\/$/, '')}/uploads/${key}` };
  }

  async remove(key: string): Promise<void> {
    if (!/^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/.test(key)) return; // refuse anything path-like
    try {
      await unlink(path.join(uploadDir, key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
}
