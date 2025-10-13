import { Router, type Response } from 'express';
import { DraftSaveInputSchema } from '@thesis-copilot/shared';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthedRequest } from '../types.js';
import { getDraft, saveDraft } from '../services/draft-service.js';

export const draftsRouter = Router();

draftsRouter.get(
  '/projects/:projectId/drafts/:sectionId',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const draft = await getDraft(req.user.id, req.params.projectId, req.params.sectionId);
    if (!draft) {
      throw new HttpError(404, 'Draft not found');
    }
    res.json({ data: draft });
  })
);

draftsRouter.put(
  '/projects/:projectId/drafts/:sectionId',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = DraftSaveInputSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    const draft = await saveDraft(
      req.user.id,
      req.params.projectId,
      req.params.sectionId,
      parsed.data
    );
    res.json({ data: draft });
  })
);
