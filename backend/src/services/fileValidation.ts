import path from 'node:path';
import { HttpError } from '../lib/errors.js';

type Signature = 'pdf' | 'png' | 'jpg' | 'gif' | 'webp' | 'zip' | 'ole' | 'text';

// Allowed types. SVG and HTML are deliberately excluded because they can carry scripts.
const TYPES: Record<string, { mime: string; sig: Signature }> = {
  '.pdf': { mime: 'application/pdf', sig: 'pdf' },
  '.docx': { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sig: 'zip' },
  '.pptx': { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', sig: 'zip' },
  '.xlsx': { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sig: 'zip' },
  '.doc': { mime: 'application/msword', sig: 'ole' },
  '.ppt': { mime: 'application/vnd.ms-powerpoint', sig: 'ole' },
  '.xls': { mime: 'application/vnd.ms-excel', sig: 'ole' },
  '.txt': { mime: 'text/plain; charset=utf-8', sig: 'text' },
  '.png': { mime: 'image/png', sig: 'png' },
  '.jpg': { mime: 'image/jpeg', sig: 'jpg' },
  '.jpeg': { mime: 'image/jpeg', sig: 'jpg' },
  '.gif': { mime: 'image/gif', sig: 'gif' },
  '.webp': { mime: 'image/webp', sig: 'webp' },
};

export const ALLOWED_EXTENSIONS = Object.keys(TYPES);

const startsWith = (b: Buffer, bytes: number[]): boolean => bytes.every((v, i) => b[i] === v);

function matches(sig: Signature, b: Buffer): boolean {
  switch (sig) {
    case 'pdf':
      return startsWith(b, [0x25, 0x50, 0x44, 0x46]);
    case 'png':
      return startsWith(b, [0x89, 0x50, 0x4e, 0x47]);
    case 'jpg':
      return startsWith(b, [0xff, 0xd8, 0xff]);
    case 'gif':
      return startsWith(b, [0x47, 0x49, 0x46, 0x38]);
    case 'webp':
      return startsWith(b, [0x52, 0x49, 0x46, 0x46]) && b.subarray(8, 12).toString('ascii') === 'WEBP';
    case 'zip':
      return startsWith(b, [0x50, 0x4b, 0x03, 0x04]);
    case 'ole':
      return startsWith(b, [0xd0, 0xcf, 0x11, 0xe0]);
    case 'text':
      return !b.subarray(0, 1024).includes(0);
  }
}

/** The browser's name for a multipart file is latin1-decoded; restore UTF-8 (for names like "Pagsusuri ñ.pdf"). */
export function fixFileName(name: string): string {
  return Buffer.from(name, 'latin1').toString('utf8');
}

export function checkFile(originalName: string, buffer: Buffer): { extension: string; mimeType: string } {
  const extension = path.extname(originalName).toLowerCase();
  const type = TYPES[extension];
  if (!type) {
    throw new HttpError(400, `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
  if (buffer.length === 0 || !matches(type.sig, buffer)) {
    throw new HttpError(400, 'The file content does not match its extension');
  }
  return { extension, mimeType: type.mime };
}
