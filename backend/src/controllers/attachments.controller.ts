import type { Request, Response } from 'express';
import { HttpError } from '../lib/errors.js';
import { param } from '../lib/asyncHandler.js';
import { linkSchema, uploadFieldsSchema } from '../schemas.js';
import { addFile, addLink, removeAttachment } from '../services/attachments.service.js';

export async function createLink(req: Request, res: Response): Promise<void> {
  const data = linkSchema.parse(req.body);
  res.status(201).json(await addLink(data));
}

export async function uploadFile(req: Request, res: Response): Promise<void> {
  if (!req.file) throw new HttpError(400, 'No file received (field name must be "file")');
  const fields = uploadFieldsSchema.parse(req.body);
  const attachment = await addFile({ ...fields, file: req.file });
  res.status(201).json(attachment);
}

export async function deleteAttachment(req: Request, res: Response): Promise<void> {
  await removeAttachment(param(req, 'id'));
  res.status(204).end();
}
