import { Router, type Response } from 'express';
import { RetrievalRequestSchema } from '@thesis-copilot/shared';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthedRequest } from '../types.js';
import { performRetrieval } from '../services/retrieval-service.js';

export const retrievalRouter = Router();

retrievalRouter.post(
  '/retrieval/query',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = RetrievalRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const result = await performRetrieval(req.user.id, parsed.data);
    res.json({ data: result });
  })
);
