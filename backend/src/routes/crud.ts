import { Router } from 'express';
import type { z } from 'zod';
import { asyncHandler, param } from '../lib/asyncHandler.js';
import { requireAdmin } from '../middleware/auth.js';
import type { Resource } from '../services/resource.js';

interface CrudOptions<S extends z.AnyZodObject, Q extends z.ZodTypeAny, TRow> {
  schema: S;
  querySchema: Q;
  resource: Resource<TRow, z.infer<S>, z.infer<Q>>;
}

/**
 * GET routes are public. POST, PUT, PATCH and DELETE require the admin cookie.
 * PUT replaces (all required fields needed); PATCH accepts any subset of fields.
 */
export function crudRouter<S extends z.AnyZodObject, Q extends z.ZodTypeAny, TRow>(
  opts: CrudOptions<S, Q, TRow>,
): Router {
  const { schema, querySchema, resource } = opts;
  const router = Router();
  const partial = schema.partial();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(await resource.list(querySchema.parse(req.query) as z.infer<Q>));
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(await resource.get(param(req, 'id')));
    }),
  );

  router.post(
    '/',
    requireAdmin,
    asyncHandler(async (req, res) => {
      res.status(201).json(await resource.create(schema.parse(req.body) as z.infer<S>));
    }),
  );

  const update = (parse: (body: unknown) => unknown) =>
    asyncHandler(async (req, res) => {
      const data = parse(req.body) as Partial<z.infer<S>>;
      res.json(await resource.update(param(req, 'id'), data));
    });
  router.put('/:id', requireAdmin, update((b) => schema.parse(b)));
  router.patch('/:id', requireAdmin, update((b) => partial.parse(b)));

  router.delete(
    '/:id',
    requireAdmin,
    asyncHandler(async (req, res) => {
      await resource.remove(param(req, 'id'));
      res.status(204).end();
    }),
  );

  return router;
}
