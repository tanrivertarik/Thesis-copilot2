import { describe, it, beforeAll, expect } from 'vitest';
import { requireEmulator } from '../emulator/utils';
import { env } from '../../apps/api/src/config/env';
import { createProject } from '../../apps/api/src/services/project-service';
import { createSource, ingestSource } from '../../apps/api/src/services/source-service';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

const suite = runIntegration ? describe : describe.skip;

suite('API ingestion flow', () => {
  beforeAll(() => {
    requireEmulator();
  });

  it('creates a project, ingests a text source, and returns summary', async () => {
    const project = await createProject('test-user', {
      title: 'Integration Test Thesis',
      topic: 'Testing ingestion pipeline',
      researchQuestions: ['How reliable is ingestion?'],
      citationStyle: 'APA',
      visibility: 'PRIVATE'
    });

    expect(project.id).toBeDefined();

    const source = await createSource('test-user', {
      projectId: project.id,
      kind: 'TEXT',
      metadata: { title: 'Inline test source' },
      upload: {
        contentType: 'TEXT',
        data: 'This is inline content for ingestion testing.'
      }
    });

    const result = await ingestSource('test-user', source.id);

    expect(result?.status).toBe('READY');
    expect(result?.chunkCount).toBeGreaterThan(0);
  });
});
