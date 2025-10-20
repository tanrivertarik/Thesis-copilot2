import { Router } from 'express';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthedRequest } from '../types.js';
import { getProject } from '../services/project-service.js';
import { getDraft } from '../services/draft-service.js';
import { exportSectionToDocx, exportProjectToDocx } from '../services/export-service.js';
import { logger } from '../utils/logger.js';

export const exportRouter = Router();

/**
 * Export a single section as DOCX
 * GET /api/projects/:projectId/sections/:sectionId/export
 */
exportRouter.get(
  '/projects/:projectId/sections/:sectionId/export',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { projectId, sectionId } = req.params;

    if (!projectId || !sectionId) {
      throw new HttpError(400, 'Project ID and Section ID are required');
    }

    logger.info('Exporting section to DOCX', {
      userId: req.user.id,
      projectId,
      sectionId
    });

    // Get project and verify ownership
    const project = await getProject(req.user.id, projectId);

    // Find section in project
    const section = project.constitution?.outline.sections.find((s) => s.id === sectionId);
    if (!section) {
      throw new HttpError(404, 'Section not found in project');
    }

    // Get draft for section
    const draft = await getDraft(req.user.id, projectId, sectionId);
    if (!draft) {
      throw new HttpError(404, 'No draft found for this section. Please generate content first.');
    }

    // Generate DOCX
    const buffer = await exportSectionToDocx(req.user.id, project, section, draft);

    // Send file
    const filename = `${section.title.replace(/[^a-z0-9]/gi, '_')}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    logger.info('Section exported successfully', {
      userId: req.user.id,
      projectId,
      sectionId,
      filename
    });
  })
);

/**
 * Export entire project as DOCX
 * GET /api/projects/:projectId/export
 */
exportRouter.get(
  '/projects/:projectId/export',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { projectId } = req.params;

    if (!projectId) {
      throw new HttpError(400, 'Project ID is required');
    }

    logger.info('Exporting project to DOCX', {
      userId: req.user.id,
      projectId
    });

    // Get project and verify ownership
    const project = await getProject(req.user.id, projectId);

    if (!project.constitution?.outline.sections || project.constitution.outline.sections.length === 0) {
      throw new HttpError(400, 'Project has no sections. Please create outline first.');
    }

    // Fetch all section drafts
    const sectionsWithDrafts: Array<{ section: any; draft: any }> = [];

    for (const section of project.constitution.outline.sections) {
      const draft = await getDraft(req.user.id, projectId, section.id);
      if (draft) {
        sectionsWithDrafts.push({ section, draft });
      }
    }

    if (sectionsWithDrafts.length === 0) {
      throw new HttpError(404, 'No drafted sections found. Please generate content for at least one section.');
    }

    // Generate DOCX
    const buffer = await exportProjectToDocx(req.user.id, project, sectionsWithDrafts);

    // Send file
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}.docx`; // !!! ? ekleyip dene
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    logger.info('Project exported successfully', {
      userId: req.user.id,
      projectId,
      filename,
      sectionCount: sectionsWithDrafts.length
    });
  })
);
