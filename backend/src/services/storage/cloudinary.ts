import { createHash } from 'node:crypto';
import { HttpError } from '../../lib/errors.js';
import type { StorageDriver, StoredFile, UploadInput } from './types.js';

interface UploadResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
  error?: { message: string };
}

const sign = (params: Record<string, string>, secret: string): string => {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + secret).digest('hex');
};

/** Cloudinary through its REST API (no SDK). Key format: "<resource_type>:<public_id>". */
export class CloudinaryStorage implements StorageDriver {
  private readonly cloud = process.env['CLOUDINARY_CLOUD_NAME'] ?? '';
  private readonly apiKey = process.env['CLOUDINARY_API_KEY'] ?? '';
  private readonly apiSecret = process.env['CLOUDINARY_API_SECRET'] ?? '';

  constructor() {
    if (!this.cloud || !this.apiKey || !this.apiSecret) {
      throw new Error('Cloudinary storage needs CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
    }
  }

  async save(file: UploadInput): Promise<StoredFile> {
    const params = {
      folder: 'student-reminder',
      timestamp: String(Math.floor(Date.now() / 1000)),
      unique_filename: 'true',
      use_filename: 'true',
    };
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimeType }), file.originalName);
    Object.entries(params).forEach(([k, v]) => form.append(k, v));
    form.append('api_key', this.apiKey);
    form.append('signature', sign(params, this.apiSecret));

    const res = await fetch(`https://api.cloudinary.com/v1_1/${this.cloud}/auto/upload`, {
      method: 'POST',
      body: form,
    });
    const body = (await res.json()) as UploadResponse;
    if (!res.ok) throw new HttpError(502, `Cloud storage upload failed: ${body.error?.message ?? res.status}`);
    return { url: body.secure_url, key: `${body.resource_type}:${body.public_id}` };
  }

  async remove(key: string): Promise<void> {
    const [resourceType, ...rest] = key.split(':');
    const publicId = rest.join(':');
    if (!resourceType || !publicId) return;
    const params = { public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)) };
    const form = new FormData();
    Object.entries(params).forEach(([k, v]) => form.append(k, v));
    form.append('api_key', this.apiKey);
    form.append('signature', sign(params, this.apiSecret));
    await fetch(`https://api.cloudinary.com/v1_1/${this.cloud}/${resourceType}/destroy`, {
      method: 'POST',
      body: form,
    });
  }
}
