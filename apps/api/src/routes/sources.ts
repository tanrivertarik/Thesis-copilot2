import { Router, type Response } from 'express';
import formidable from 'formidable';
import { SourceCreateSchema, SourceUploadSchema } from '@thesis-copilot/shared';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthedRequest } from '../types.js';
import {
  createSource,
  ingestSource,
  listSources,
  uploadSourceContent,
  uploadSourceFile
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

sourcesRouter.post(
  '/sources/:sourceId/upload-file',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowEmptyFiles: false,
      filter: ({ mimetype }) => {
        return mimetype === 'application/pdf' || mimetype === 'text/plain';
      }
    });

    try {
      const [fields, files] = await form.parse(req);
      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
      
      if (!uploadedFile) {
        throw new HttpError(400, 'No file uploaded');
      }

      const fileData = {
        filepath: uploadedFile.filepath,
        mimetype: uploadedFile.mimetype || undefined,
        originalFilename: uploadedFile.originalFilename || undefined
      };

      const result = await uploadSourceFile(req.user.id, req.params.sourceId, fileData);
      if (!result) {
        throw new HttpError(404, 'Source not found');
      }

      res.json({ data: result });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(400, `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })
);
