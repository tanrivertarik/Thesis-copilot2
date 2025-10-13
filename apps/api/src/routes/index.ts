import type { Express } from 'express';
import { projectsRouter } from './projects.js';
import { sourcesRouter } from './sources.js';
import { retrievalRouter } from './retrieval.js';
import { draftingRouter } from './drafting.js';
import { draftsRouter } from './drafts.js';
import { constitutionRouter } from './constitution.js';

export function registerRoutes(app: Express) {
  app.get('/', (_req, res) => {
    res.json({
      message: 'Thesis Copilot API',
      docs: '/docs (todo)'
    });
  });

  app.use('/api/projects', projectsRouter);
  app.use('/api', sourcesRouter);
  app.use('/api', retrievalRouter);
  app.use('/api', draftingRouter);
  app.use('/api', draftsRouter);
  app.use('/api/projects', constitutionRouter);
}
