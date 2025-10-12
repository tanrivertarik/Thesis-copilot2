import { randomUUID } from 'crypto';
import type {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput
} from '@thesis-copilot/shared';

const projects = new Map<string, Project>();

export async function listProjects(ownerId: string): Promise<Project[]> {
  return Array.from(projects.values()).filter((project) => project.ownerId === ownerId);
}

export async function getProject(ownerId: string, projectId: string): Promise<Project | null> {
  const project = projects.get(projectId);
  if (!project || project.ownerId !== ownerId) {
    return null;
  }
  return project;
}

export async function createProject(
  ownerId: string,
  input: ProjectCreateInput
): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    id: randomUUID(),
    ownerId,
    title: input.title,
    topic: input.topic,
    researchQuestions: input.researchQuestions,
    thesisStatement: input.thesisStatement,
    citationStyle: input.citationStyle,
    constitution: input.constitution,
    visibility: input.visibility ?? 'PRIVATE',
    createdAt: now,
    updatedAt: now
  };

  projects.set(project.id, project);
  return project;
}

export async function updateProject(
  ownerId: string,
  projectId: string,
  input: ProjectUpdateInput
): Promise<Project | null> {
  const existing = projects.get(projectId);
  if (!existing || existing.ownerId !== ownerId) {
    return null;
  }

  const updated: Project = {
    ...existing,
    ...input,
    constitution: input.constitution ?? existing.constitution,
    updatedAt: new Date().toISOString()
  };

  projects.set(projectId, updated);
  return updated;
}

export async function deleteProject(ownerId: string, projectId: string): Promise<boolean> {
  const existing = projects.get(projectId);
  if (!existing || existing.ownerId !== ownerId) {
    return false;
  }
  projects.delete(projectId);
  return true;
}

// Seed a sample project for demo purposes
void (async () => {
  const ownerId = 'demo-user';
  if ((await listProjects(ownerId)).length === 0) {
    await createProject(ownerId, {
      title: 'AI-Augmented Literature Review',
      topic: 'Exploring AI assistance in academic writing workflows',
      researchQuestions: [
        'How do AI copilots affect the quality of literature reviews?',
        'What guardrails are necessary to maintain academic integrity?'
      ],
      citationStyle: 'APA',
      visibility: 'PRIVATE',
      thesisStatement:
        'AI copilots can accelerate drafting while maintaining academic integrity when combined with source-grounded guardrails.',
      constitution: {
        scope: 'Investigate AI-assisted thesis workflows within graduate programs.',
        toneGuidelines: 'Formal academic tone with emphasis on evidence-backed claims.',
        coreArgument:
          'With proper safeguards, AI copilots reduce authoring friction without compromising academic standards.',
        outline: {
          sections: [
            {
              id: randomUUID(),
              title: 'Introduction',
              objective: 'Frame the problem space and research motivation.'
            },
            {
              id: randomUUID(),
              title: 'Methodology',
              objective: 'Detail evaluation criteria for AI-assisted drafting.'
            }
          ]
        }
      }
    });
  }
})();
