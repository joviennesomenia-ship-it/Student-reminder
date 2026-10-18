import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { HttpError } from '../lib/errors.js';

function clientErrorStatus(err: unknown): number | null {
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as { status: unknown }).status;
    if (typeof status === 'number' && status >= 400 && status < 500) return status;
  }
  return null;
}

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten().fieldErrors });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'An item with that value already exists' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(400).json({ error: 'A related item (such as the subject) does not exist' });
      return;
    }
  }
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    res
      .status(tooBig ? 413 : 400)
      .json({ error: tooBig ? `File is larger than ${env.MAX_UPLOAD_MB} MB` : err.message });
    return;
  }
  const clientStatus = clientErrorStatus(err);
  if (clientStatus) {
    res.status(clientStatus).json({ error: 'Invalid request' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: env.isProd ? 'Internal server error' : String(err) });
};
