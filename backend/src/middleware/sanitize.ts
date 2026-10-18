import type { RequestHandler } from 'express';
import { sanitizeDeep } from '../lib/sanitize.js';

export const sanitizeBody: RequestHandler = (req, _res, next) => {
  if (req.body !== undefined) req.body = sanitizeDeep(req.body);
  next();
};
