import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { HttpError } from './lib/errors.js';
import { csrfGuard } from './middleware/csrf.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { apiRouter } from './routes/index.js';
import { mountLocalUploads } from './routes/uploads.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1); // behind Render/Railway/Fly proxies
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: (origin, cb) => {
        // allow tools without an Origin header, and the configured frontend(s)
        if (!origin || env.allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new HttpError(403, 'Origin not allowed'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Requested-With'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  if (env.STORAGE_DRIVER === 'local') mountLocalUploads(app);

  app.use('/api', apiLimiter, csrfGuard, apiRouter());

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(errorHandler);

  return app;
}
