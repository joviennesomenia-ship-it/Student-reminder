import type { RequestHandler } from 'express';
import { HttpError } from '../lib/errors.js';
import { ACCESS_COOKIE, verifyToken } from '../lib/tokens.js';

export const requireAdmin: RequestHandler = (req, res, next) => {
  const cookies = req.cookies as Record<string, unknown>;
  const username = verifyToken(cookies[ACCESS_COOKIE], 'access');
  if (!username) return next(new HttpError(401, 'Admin login required'));
  res.locals['admin'] = username;
  next();
};
