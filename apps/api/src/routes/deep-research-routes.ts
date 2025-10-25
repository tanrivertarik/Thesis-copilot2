import { Router } from 'express';
import type { Response } from 'express';
import { authMiddleware, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import {
  generateResearchPlan,
  refineResearchPlan,
  type ResearchPlan
} from '../services/research-planning-service.js';
import {
  searchSemanticScholar,
  type AcademicPaper
} from '../services/semantic-scholar-service.js';
import {
  scrapeWebPage,
  scrapeMultiplePages
} from '../services/web-scraping-service.js';
import {
  ingestAcademicPaper,
  ingestWebPage,
  ingestMultiplePapers
} from '../services/content-ingestion-service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/research/plan
 * Generate a research plan from a user query with project context
 */
router.post(
  '/plan',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { query, projectId } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string'
      });
    }

    logger.info('Generating research plan with project context');

    // Fetch project context if projectId is provided
    let thesisContext = {};
    if (projectId) {
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      const projectDoc = await db.collection('projects').doc(projectId).get();

      if (projectDoc.exists) {
        const project = projectDoc.data();
        thesisContext = {
          topic: project?.topic,
          researchQuestions: project?.researchQuestions,
          thesisStatement: project?.thesisStatement
        };
      }
    }

    const plan = await generateResearchPlan(query, thesisContext);

    res.json({
      success: true,
      data: plan
    });
  })
);

/**
 * POST /api/research/plan/:planId/refine
 * Refine an existing research plan based on user feedback with project context
 */
router.post(
  '/plan/:planId/refine',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { feedback, existingPlan, projectId } = req.body;

    if (!feedback || !existingPlan) {
      return res.status(400).json({
        error: 'Feedback and existing plan are required'
      });
    }

    logger.info('Refining research plan with project context');

    // Fetch project context if projectId is provided
    let thesisContext;
    if (projectId) {
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      const projectDoc = await db.collection('projects').doc(projectId).get();

      if (projectDoc.exists) {
        const project = projectDoc.data();
        thesisContext = {
          topic: project?.topic,
          researchQuestions: project?.researchQuestions,
          thesisStatement: project?.thesisStatement
        };
      }
    }

    const refinedPlan = await refineResearchPlan(existingPlan, feedback, thesisContext);

    res.json({
      success: true,
      data: refinedPlan
    });
  })
);

/**
 * POST /api/research/search/academic
 * Search for academic papers using Semantic Scholar
 */
router.post(
  '/search/academic',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { query, options = {} } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string'
      });
    }

    logger.info('Searching academic papers');

    const papers = await searchSemanticScholar(query, options);

    res.json({
      success: true,
      data: {
        papers,
        count: papers.length
      }
    });
  })
);

/**
 * POST /api/research/scrape
 * Scrape content from a single web page
 */
router.post(
  '/scrape',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'URL is required and must be a string'
      });
    }

    logger.info('Scraping web page');

    const content = await scrapeWebPage(url);

    res.json({
      success: true,
      data: content
    });
  })
);

/**
 * POST /api/research/scrape/batch
 * Scrape content from multiple web pages
 */
router.post(
  '/scrape/batch',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { urls, options = {} } = req.body;

    if (!Array.isArray(urls)) {
      return res.status(400).json({
        error: 'URLs must be an array'
      });
    }

    logger.info('Batch scraping web pages');

    const results = await scrapeMultiplePages(urls, options);

    res.json({
      success: true,
      data: {
        results,
        successful: results.filter(r => r !== null).length,
        failed: results.filter(r => r === null).length
      }
    });
  })
);

/**
 * POST /api/research/ingest/paper
 * Ingest a single academic paper
 */
router.post(
  '/ingest/paper',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { projectId, paper } = req.body;

    if (!projectId || !paper) {
      return res.status(400).json({
        error: 'Project ID and paper data are required'
      });
    }

    logger.info('Ingesting academic paper');

    const result = await ingestAcademicPaper(projectId, req.user.id, paper);

    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * POST /api/research/ingest/papers
 * Ingest multiple academic papers with progress tracking
 */
router.post(
  '/ingest/papers',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { projectId, papers } = req.body;

    if (!projectId || !Array.isArray(papers)) {
      return res.status(400).json({
        error: 'Project ID and papers array are required'
      });
    }

    logger.info('Batch ingesting papers');

    const results = await ingestMultiplePapers(projectId, req.user.id, papers);

    res.json({
      success: true,
      data: {
        results,
        successful: results.length,
        failed: papers.length - results.length
      }
    });
  })
);

/**
 * POST /api/research/ingest/webpage
 * Ingest content from a web page
 */
router.post(
  '/ingest/webpage',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { projectId, url } = req.body;

    if (!projectId || !url) {
      return res.status(400).json({
        error: 'Project ID and URL are required'
      });
    }

    logger.info('Ingesting web page');

    const result = await ingestWebPage(projectId, req.user.id, url);

    res.json({
      success: true,
      data: result
    });
  })
);

export default router;
