import { Router, type Response } from 'express';
import { SourceCreateSchema, SourceUploadSchema } from '@thesis-copilot/shared';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthedRequest } from '../types.js';
import {
  createSource,
  ingestSource,
  listSources,
  uploadSourceContent
} from '../services/source-service.js';

export const sourcesRouter = Router();

sourcesRouter.get(
  '/projects/:projectId/sources',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const sources = await listSources(req.user.id, req.params.projectId);
    res.json({ data: sources });
  })
);

sourcesRouter.post(
  '/sources',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = SourceCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const source = await createSource(req.user.id, parsed.data);
    res.status(201).json({ data: source });
  })
);

sourcesRouter.post(
  '/sources/:sourceId/ingest',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const result = await ingestSource(req.user.id, req.params.sourceId);
    if (!result) {
      throw new HttpError(404, 'Source not found');
    }
    res.json({ data: result });
  })
);

sourcesRouter.post(
  '/sources/:sourceId/upload',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = SourceUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    const ok = await uploadSourceContent(req.user.id, req.params.sourceId, parsed.data);
    if (!ok) {
      throw new HttpError(404, 'Source not found');
    }

    res.status(204).send();
  })
);
