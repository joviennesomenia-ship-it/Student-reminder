import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Express 4 does not catch rejected promises, so every async handler is wrapped. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) throw new Error(`Missing route parameter: ${name}`);
  return value;
}
