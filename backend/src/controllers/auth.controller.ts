import { createHash, timingSafeEqual } from 'node:crypto';
import type { CookieOptions, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../config/env.js';
import { HttpError } from '../lib/errors.js';
import { ACCESS_COOKIE, REFRESH_COOKIE, signToken, verifyToken } from '../lib/tokens.js';

const loginSchema = z.object({ username: z.string().max(100), password: z.string().max(200) });

const REFRESH_PATH = '/api/auth';

// Cross-site hosting (frontend and backend on different domains) needs SameSite=None + Secure.
const base = (): CookieOptions => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
});

function startSession(res: Response, username: string): void {
  res.cookie(ACCESS_COOKIE, signToken(username, 'access'), {
    ...base(),
    path: '/',
    maxAge: env.ACCESS_TOKEN_TTL_MIN * 60_000,
  });
  res.cookie(REFRESH_COOKIE, signToken(username, 'refresh'), {
    ...base(),
    path: REFRESH_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  });
}

function endSession(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...base(), path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...base(), path: REFRESH_PATH });
}

const digest = (s: string): Buffer => createHash('sha256').update(s).digest();
const cookiesOf = (req: Request): Record<string, unknown> => req.cookies as Record<string, unknown>;

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = loginSchema.parse(req.body);
  // Always run both checks so response time does not reveal whether the username was right.
  const userOk = timingSafeEqual(digest(username), digest(env.ADMIN_USERNAME));
  const passOk = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  if (!userOk || !passOk) throw new HttpError(401, 'Invalid username or password');
  startSession(res, env.ADMIN_USERNAME);
  res.json({ admin: true, username: env.ADMIN_USERNAME });
}

export function logout(_req: Request, res: Response): void {
  endSession(res);
  res.status(204).end();
}

/** Never returns 401: the public site calls this on load to learn whether to show admin controls. */
export function me(req: Request, res: Response): void {
  const cookies = cookiesOf(req);
  const access = verifyToken(cookies[ACCESS_COOKIE], 'access');
  if (access) {
    res.json({ admin: true, username: access });
    return;
  }
  const refresh = verifyToken(cookies[REFRESH_COOKIE], 'refresh');
  if (refresh) {
    startSession(res, refresh);
    res.json({ admin: true, username: refresh });
    return;
  }
  res.json({ admin: false });
}

export function refresh(req: Request, res: Response): void {
  const username = verifyToken(cookiesOf(req)[REFRESH_COOKIE], 'refresh');
  if (!username) {
    endSession(res);
    throw new HttpError(401, 'Session expired. Please log in again.');
  }
  startSession(res, username); // rotates both tokens
  res.json({ admin: true, username });
}
