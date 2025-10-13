import { Router, type Response } from 'express';
import { z } from 'zod';
import { 
  generateConstitution, 
  refineConstitution,
  saveConstitutionToProject,
  getConstitutionSuggestions 
} from '../services/constitution-service.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import type { AuthedRequest } from '../types.js';

export const constitutionRouter = Router();

// Schema for constitution generation request
const GenerateConstitutionSchema = z.object({
  academicLevel: z.enum(['UNDERGRADUATE', 'MASTERS', 'PHD']),
  discipline: z.string().min(1),
  includeExistingSources: z.boolean().default(false)
});

// Schema for constitution refinement request  
const RefineConstitutionSchema = z.object({
  feedback: z.string().min(1),
  preserveOutline: z.boolean().default(false)
});

/**
 * POST /api/projects/:projectId/constitution/generate
 * Generate a new thesis constitution for a project
 */
constitutionRouter.post('/:projectId/constitution/generate', asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { projectId } = req.params;
  const parsed = GenerateConstitutionSchema.safeParse(req.body);
  
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.message);
  }

  const result = await generateConstitution({
    projectId,
    ...parsed.data
  });

  // Automatically save the generated constitution to the project
  await saveConstitutionToProject(projectId, result.constitution);

  res.json({
    data: {
      constitution: result.constitution,
      metadata: result.generationMetadata
    }
  });
}));

/**
 * POST /api/projects/:projectId/constitution/refine
 * Refine an existing constitution based on user feedback
 */
constitutionRouter.post('/:projectId/constitution/refine', asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { projectId } = req.params;
  const parsed = RefineConstitutionSchema.safeParse(req.body);
  
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.message);
  }

  const result = await refineConstitution({
    projectId,
    ...parsed.data
  });

  // Automatically save the refined constitution
  await saveConstitutionToProject(projectId, result.constitution);

  res.json({
    data: {
      constitution: result.constitution,
      metadata: result.generationMetadata
    }
  });
}));

/**
 * GET /api/projects/:projectId/constitution/suggestions
 * Get AI-powered suggestions for constitution generation parameters
 */
constitutionRouter.get('/:projectId/constitution/suggestions', asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { projectId } = req.params;
  const suggestions = await getConstitutionSuggestions(projectId);
  
  res.json({ data: suggestions });
}));

/**
 * PUT /api/projects/:projectId/constitution
 * Manually update a project's constitution
 */
constitutionRouter.put('/:projectId/constitution', asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { projectId } = req.params;
  
  // Basic validation - should match ThesisConstitutionSchema
  const constitution = req.body;
  if (!constitution.scope || !constitution.toneGuidelines || !constitution.coreArgument) {
    throw new HttpError(400, 'Constitution must include scope, toneGuidelines, and coreArgument');
  }

  await saveConstitutionToProject(projectId, constitution);
  
  res.json({ data: { success: true } });
}));