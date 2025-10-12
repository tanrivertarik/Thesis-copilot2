import { Router, type Response } from 'express';
import { SectionDraftRequestSchema } from '@thesis-copilot/shared';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthedRequest } from '../types.js';
import { generateSectionDraft } from '../services/drafting-service.js';

export const draftingRouter = Router();

draftingRouter.post(
  '/drafting/section',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = SectionDraftRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    const result = await generateSectionDraft(req.user.id, parsed.data);
    res.json({ data: result });
  })
);
