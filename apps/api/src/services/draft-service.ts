import { randomUUID } from 'crypto';
import type {
  Draft,
  DraftSaveInput,
  DraftVersion
} from '@thesis-copilot/shared';
import { getFirestore } from '../lib/firestore.js';
import { getProject } from './project-service.js';

const COLLECTION = 'drafts';
const VERSION_HISTORY_LIMIT = 10;

type DraftDocument = Draft & { ownerId: string };

function docToDraft(
  snapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): DraftDocument | null {
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as DraftDocument;
  return {
    ...data,
    id: snapshot.id
  };
}

async function ensureProjectOwnership(ownerId: string, projectId: string) {
  const project = await getProject(ownerId, projectId);
  if (!project) {
    return null;
  }
  return project;
}

function createVersionFromDraft(draft: DraftDocument): DraftVersion {
  const version: DraftVersion = {
    id: randomUUID(),
    html: draft.html,
    createdAt: draft.updatedAt,
    createdBy: draft.lastSavedBy
  };

  // Only add summary if there are citations (avoid undefined in Firestore)
  if (draft.citations.length > 0) {
    version.summary = `Saved with ${draft.citations.length} citation${draft.citations.length > 1 ? 's' : ''}`;
  }

  return version;
}

function draftsEqual(a: DraftDocument, b: DraftSaveInput) {
  if (a.html !== b.html) {
    return false;
  }

  if (a.citations.length !== b.citations.length) {
    return false;
  }

  if (a.annotations.length !== b.annotations.length) {
    return false;
  }

  const aCitations = JSON.stringify(a.citations);
  const bCitations = JSON.stringify(b.citations);
  if (aCitations !== bCitations) {
    return false;
  }

  const aAnnotations = JSON.stringify(a.annotations);
  const bAnnotations = JSON.stringify(b.annotations);
  if (aAnnotations !== bAnnotations) {
    return false;
  }

  return true;
}

export async function getDraft(
  ownerId: string,
  projectId: string,
  sectionId: string
): Promise<Draft | null> {
  const project = await ensureProjectOwnership(ownerId, projectId);
  if (!project) {
    return null;
  }

  const db = getFirestore();
  const docId = `${projectId}_${sectionId}`;
  const docRef = db.collection(COLLECTION).doc(docId);
  const snapshot = await docRef.get();
  const draft = docToDraft(snapshot);
  if (!draft || draft.ownerId !== ownerId) {
    return null;
  }
  const { ownerId: _ownerId, ...rest } = draft;
  return rest;
}

export async function saveDraft(
  ownerId: string,
  projectId: string,
  sectionId: string,
  input: DraftSaveInput
): Promise<Draft> {
  const project = await ensureProjectOwnership(ownerId, projectId);
  if (!project) {
    throw new Error('Project not found or access denied');
  }

  const db = getFirestore();
  const docId = `${projectId}_${sectionId}`;
  const docRef = db.collection(COLLECTION).doc(docId);
  const snapshot = await docRef.get();
  const existing = docToDraft(snapshot);

  const now = new Date().toISOString();

  if (existing && draftsEqual(existing, input)) {
    const { ownerId: _ownerId, ...rest } = existing;
    return rest;
  }

  const version = existing ? existing.version + 1 : 1;
  const createdAt = existing?.createdAt ?? now;

  let versions: DraftVersion[] = existing?.versions ?? [];
  if (existing) {
    const previousVersion = createVersionFromDraft(existing);
    versions = [previousVersion, ...versions].slice(0, VERSION_HISTORY_LIMIT);
  }

  const draft: DraftDocument = {
    id: docId,
    ownerId,
    projectId,
    sectionId,
    html: input.html,
    citations: input.citations,
    annotations: input.annotations,
    version,
    versions,
    createdAt,
    updatedAt: now,
    lastSavedBy: input.lastSavedBy ?? ownerId
  };

  await docRef.set(draft, { merge: true });

  const { ownerId: _ownerId, ...rest } = draft;
  return rest;
}

export async function restoreDraftVersion(
  ownerId: string,
  projectId: string,
  sectionId: string,
  versionId: string
): Promise<Draft | null> {
  const project = await ensureProjectOwnership(ownerId, projectId);
  if (!project) {
    throw new Error('Project not found or access denied');
  }

  const db = getFirestore();
  const docId = `${projectId}_${sectionId}`;
  const docRef = db.collection(COLLECTION).doc(docId);
  const snapshot = await docRef.get();
  const existing = docToDraft(snapshot);

  if (!existing || existing.ownerId !== ownerId) {
    return null;
  }

  // Find the version to restore
  const versionToRestore = existing.versions.find((v) => v.id === versionId);
  if (!versionToRestore) {
    throw new Error('Version not found');
  }

  const now = new Date().toISOString();

  // Create a version from current state before restoring
  const currentVersion = createVersionFromDraft(existing);
  const versions = [currentVersion, ...existing.versions].slice(0, VERSION_HISTORY_LIMIT);

  const draft: DraftDocument = {
    ...existing,
    html: versionToRestore.html,
    version: existing.version + 1,
    versions,
    updatedAt: now,
    lastSavedBy: ownerId
  };

  await docRef.set(draft, { merge: true });

  const { ownerId: _ownerId, ...rest } = draft;
  return rest;
}
