import { Router, type Response } from 'express';
import { SectionDraftRequestSchema } from '@thesis-copilot/shared';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthedRequest } from '../types.js';
import { generateSectionDraftStreaming, type StreamEvent } from '../services/drafting-service-streaming.js';

export const draftingStreamRouter = Router();

/**
 * Streaming endpoint for draft generation
 * Returns Server-Sent Events (SSE) with real-time tokens
 */
draftingStreamRouter.post(
  '/drafting/section/stream',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = SectionDraftRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    try {
      await generateSectionDraftStreaming(req.user.id, parsed.data, (event: StreamEvent) => {
        // Send SSE events to client
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      });

      // Send completion event
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      // Send error event
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: (error as Error).message 
      })}\n\n`);
      res.end();
    }
  })
);
