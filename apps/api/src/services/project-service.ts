import { randomUUID } from 'crypto';
import type {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput
} from '@thesis-copilot/shared';
import { getFirestore } from '../lib/firestore.js';

const COLLECTION = 'projects';

function docToProject(
  snapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): Project | null {
  if (!snapshot.exists) {
    return null;
  }
  const data = snapshot.data() as Project;
  return { ...data, id: snapshot.id };
}

export async function listProjects(ownerId: string): Promise<Project[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where('ownerId', '==', ownerId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs
    .map(docToProject)
    .filter((project): project is Project => Boolean(project));
}

export async function getProject(ownerId: string, projectId: string): Promise<Project | null> {
  const db = getFirestore();
  const doc = await db.collection(COLLECTION).doc(projectId).get();
  const project = docToProject(doc);
  if (!project || project.ownerId !== ownerId) {
    return null;
  }
  return project;
}

export async function createProject(
  ownerId: string,
  input: ProjectCreateInput
): Promise<Project> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const id = randomUUID();
  const project: Project = {
    id,
    ownerId,
    title: input.title,
    topic: input.topic,
    researchQuestions: input.researchQuestions,
    citationStyle: input.citationStyle,
    visibility: input.visibility ?? 'PRIVATE',
    createdAt: now,
    updatedAt: now
  };

  if (input.thesisStatement) {
    project.thesisStatement = input.thesisStatement;
  }

  if (input.constitution) {
    project.constitution = input.constitution;
  }

  if (input.targetWordCount !== undefined) {
    project.targetWordCount = input.targetWordCount;
  }

  if (input.thesisMetadata) {
    project.thesisMetadata = input.thesisMetadata;
  }

  await db.collection(COLLECTION).doc(id).set(project);
  return project;
}

export async function updateProject(
  ownerId: string,
  projectId: string,
  input: ProjectUpdateInput
): Promise<Project | null> {
  const db = getFirestore();
  const docRef = db.collection(COLLECTION).doc(projectId);
  const snapshot = await docRef.get();
  const existing = docToProject(snapshot);
  if (!existing || existing.ownerId !== ownerId) {
    return null;
  }

  const updated: Project = {
    ...existing,
    ...input,
    updatedAt: new Date().toISOString()
  };

  if (input.thesisStatement === undefined) {
    delete (updated as Partial<Project>).thesisStatement;
  }

  if (input.constitution === undefined) {
    updated.constitution = existing.constitution;
  }

  if (input.targetWordCount === undefined) {
    updated.targetWordCount = existing.targetWordCount;
  }

  if (input.thesisMetadata === undefined) {
    updated.thesisMetadata = existing.thesisMetadata;
  }

  const toWrite = { ...updated } as Record<string, unknown>;
  if (toWrite.thesisStatement === undefined) {
    delete toWrite.thesisStatement;
  }
  if (toWrite.constitution === undefined) {
    delete toWrite.constitution;
  }
  if (toWrite.targetWordCount === undefined) {
    delete toWrite.targetWordCount;
  }
  if (toWrite.thesisMetadata === undefined) {
    delete toWrite.thesisMetadata;
  }

  await docRef.set(toWrite, { merge: true });
  return updated;
}

export async function deleteProject(ownerId: string, projectId: string): Promise<boolean> {
  const db = getFirestore();
  const docRef = db.collection(COLLECTION).doc(projectId);
  const snapshot = await docRef.get();
  const project = docToProject(snapshot);
  if (!project || project.ownerId !== ownerId) {
    return false;
  }
  await docRef.delete();
  return true;
}

// Sample seeding function for development (call manually if needed)
export async function seedSampleProject() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  try {
    const ownerId = 'demo-user';
    const existing = await listProjects(ownerId);
    if (existing.length === 0) {
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

      console.log('[seed] Created sample project for development');
    }
  } catch (error) {
    console.error('[seed] failed to create sample project', error);
  }
}
