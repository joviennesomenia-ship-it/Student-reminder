import type { Express } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';
import { uploadDir } from '../services/storage/local.js';

const SAFE_NAME = /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/;
const INLINE = /\.(pdf|png|jpe?g|gif|webp|txt)$/;

/** Serves locally stored files. Only files registered in the database are reachable. */
export function mountLocalUploads(app: Express): void {
  app.get(
    '/uploads/:name',
    asyncHandler(async (req, res) => {
      const name = req.params['name'] ?? '';
      if (!SAFE_NAME.test(name)) throw notFound('File');
      const record = await prisma.attachment.findFirst({ where: { storageKey: name } });
      if (!record) throw notFound('File');

      const wantsDownload = req.query['download'] === '1' || !INLINE.test(name);
      const disposition = wantsDownload ? 'attachment' : 'inline';
      res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(record.name)}`);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(name, { root: uploadDir, dotfiles: 'deny' });
    }),
  );
}
