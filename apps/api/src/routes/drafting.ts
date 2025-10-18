import { Router, type Response } from 'express';
import {
  SectionDraftRequestSchema,
  RewriteDraftRequestSchema,
  AICommandRequestSchema
} from '@thesis-copilot/shared';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthedRequest } from '../types.js';
import {
  generateSectionDraft,
  generateParagraphRewrite,
  processAICommand
} from '../services/drafting-service.js';

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

draftingRouter.post(
  '/drafting/rewrite',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = RewriteDraftRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    try {
      const result = await generateParagraphRewrite(req.user.id, parsed.data);
      res.json({ data: result });
    } catch (error) {
      if ((error as Error).message.includes('Project not found')) {
        throw new HttpError(404, 'Project not found');
      }
      throw error;
    }
  })
);

draftingRouter.post(
  '/drafting/command',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = AICommandRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    const result = await processAICommand(req.user.id, parsed.data);
    res.json({ data: result });
  })
);
