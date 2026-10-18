import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

type TokenType = 'access' | 'refresh';

export const ACCESS_COOKIE = 'sr_access';
export const REFRESH_COOKIE = 'sr_refresh';

const secretFor = (type: TokenType): string =>
  type === 'access' ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;

export function signToken(username: string, type: TokenType): string {
  const expiresIn = type === 'access' ? `${env.ACCESS_TOKEN_TTL_MIN}m` : `${env.REFRESH_TOKEN_TTL_DAYS}d`;
  return jwt.sign({ typ: type }, secretFor(type), { subject: username, expiresIn, algorithm: 'HS256' });
}

/** Returns the username if the token is valid and of the expected type, otherwise null. */
export function verifyToken(token: unknown, type: TokenType): string | null {
  if (typeof token !== 'string' || token.length === 0) return null;
  try {
    const payload = jwt.verify(token, secretFor(type), { algorithms: ['HS256'] });
    if (typeof payload === 'string' || payload['typ'] !== type || typeof payload.sub !== 'string') {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}
