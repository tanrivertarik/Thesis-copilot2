import { Router, type Response } from 'express';
import { ProjectCreateSchema, ProjectUpdateSchema } from '@thesis-copilot/shared';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthedRequest } from '../types.js';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from '../services/project-service.js';

export const projectsRouter = Router();

projectsRouter.get('/', asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = await listProjects(req.user.id);
  res.json({ data });
}));

projectsRouter.post('/', asyncHandler(async (req: AuthedRequest, res: Response) => {
  const parsed = ProjectCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.message);
  }
  const project = await createProject(req.user.id, parsed.data);
  res.status(201).json({ data: project });
}));

projectsRouter.get(
  '/:projectId',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const project = await getProject(req.user.id, req.params.projectId);
    if (!project) {
      throw new HttpError(404, 'Project not found');
    }
    res.json({ data: project });
  })
);

projectsRouter.patch(
  '/:projectId',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = ProjectUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.message);
    }
    const project = await updateProject(req.user.id, req.params.projectId, parsed.data);
    if (!project) {
      throw new HttpError(404, 'Project not found');
    }
    res.json({ data: project });
  })
);

projectsRouter.delete(
  '/:projectId',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const deleted = await deleteProject(req.user.id, req.params.projectId);
    if (!deleted) {
      throw new HttpError(404, 'Project not found');
    }
    res.status(204).send();
  })
);
