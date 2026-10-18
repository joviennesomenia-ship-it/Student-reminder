import type { RequestHandler } from 'express';
import { HttpError } from '../lib/errors.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Cookies are sent cross-site in production (SameSite=None), so every state-changing request must
 * carry a custom header. Browsers cannot add it to cross-site form posts, and the CORS allowlist
 * blocks it from other origins.
 */
export const csrfGuard: RequestHandler = (req, _res, next) => {
  if (SAFE.has(req.method) || req.get('x-requested-with') === 'sr-web') return next();
  next(new HttpError(403, 'Missing required request header'));
};
