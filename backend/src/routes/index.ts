import { Router } from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { login, logout, me, refresh } from '../controllers/auth.controller.js';
import { createLink, deleteAttachment, uploadFile } from '../controllers/attachments.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { sanitizeBody } from '../middleware/sanitize.js';
import {
  announcementSchema,
  emptyQuery,
  eventQuery,
  eventSchema,
  performanceTaskSchema,
  reviewerSchema,
  subjectQuery,
  subjectSchema,
  taskSchema,
} from '../schemas.js';
import { announcementsService } from '../services/announcements.service.js';
import { eventsService } from '../services/events.service.js';
import { performanceTasksService } from '../services/performanceTasks.service.js';
import { reviewersService } from '../services/reviewers.service.js';
import { subjectsService } from '../services/subjects.service.js';
import { tasksService } from '../services/tasks.service.js';
import { crudRouter } from './crud.js';

export function apiRouter(): Router {
  const api = Router();

  // Auth: not sanitized (passwords must reach bcrypt untouched).
  const auth = Router();
  auth.post('/login', loginLimiter, asyncHandler(async (req, res) => login(req, res)));
  auth.post('/logout', logout);
  auth.post('/refresh', refresh);
  auth.get('/me', me);
  api.use('/auth', auth);

  // Everything below strips HTML from incoming text.
  api.use(sanitizeBody);

  api.use('/subjects', crudRouter({ schema: subjectSchema, querySchema: emptyQuery, resource: subjectsService }));
  api.use('/tasks', crudRouter({ schema: taskSchema, querySchema: subjectQuery, resource: tasksService }));
  api.use(
    '/performance-tasks',
    crudRouter({ schema: performanceTaskSchema, querySchema: subjectQuery, resource: performanceTasksService }),
  );
  api.use('/reviewers', crudRouter({ schema: reviewerSchema, querySchema: subjectQuery, resource: reviewersService }));
  api.use('/events', crudRouter({ schema: eventSchema, querySchema: eventQuery, resource: eventsService }));
  api.use(
    '/announcements',
    crudRouter({ schema: announcementSchema, querySchema: emptyQuery, resource: announcementsService }),
  );

  // Attachments: links, file upload, delete (all admin-only).
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  });
  api.post('/attachments/links', requireAdmin, asyncHandler(async (req, res) => createLink(req, res)));
  api.delete('/attachments/:id', requireAdmin, asyncHandler(async (req, res) => deleteAttachment(req, res)));
  api.post(
    '/upload',
    requireAdmin,
    upload.single('file'),
    sanitizeBody,
    asyncHandler(async (req, res) => uploadFile(req, res)),
  );

  return api;
}
