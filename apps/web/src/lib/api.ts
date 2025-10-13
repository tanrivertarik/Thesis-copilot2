import type {
  Draft,
  DraftSaveInput,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  RetrievalRequest,
  RetrievalResult,
  RewriteDraftRequest,
  RewriteDraftResponse,
  SectionDraftRequest,
  SectionDraftResponse,
  Source,
  SourceCreateInput,
  SourceIngestionResult
} from '@thesis-copilot/shared';
import { env } from './env';
import { getIdToken } from './auth-token';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../app/providers/firebase/app-instance';

const API_BASE_URL = env.apiBaseUrl;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken();
  if (!token) {
    await getAuth(firebaseApp).signOut();
    window.location.href = '/login';
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      await getAuth(firebaseApp).signOut();
      window.location.href = '/login';
    }
    const message = await response.text();
    throw new Error(`API ${response.status}: ${message}`);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}

export async function fetchProjects(): Promise<Project[]> {
  return request<Project[]>('/api/projects');
}

export async function fetchDraft(
  projectId: string,
  sectionId: string
): Promise<Draft | null> {
  try {
    return await request<Draft>(`/api/projects/${projectId}/drafts/${sectionId}`);
  } catch (error) {
    if (error instanceof Error && /API 404/.test(error.message)) {
      return null;
    }
    throw error;
  }
}

export async function saveDraft(
  projectId: string,
  sectionId: string,
  payload: DraftSaveInput
): Promise<Draft> {
  return request<Draft>(`/api/projects/${projectId}/drafts/${sectionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function fetchSources(projectId: string): Promise<Source[]> {
  return request<Source[]>(`/api/projects/${projectId}/sources`);
}

export async function createProject(payload: ProjectCreateInput): Promise<Project> {
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateProject(
  projectId: string,
  payload: ProjectUpdateInput
): Promise<Project> {
  return request<Project>(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function createSource(payload: SourceCreateInput): Promise<Source> {
  return request<Source>('/api/sources', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function ingestSource(sourceId: string): Promise<SourceIngestionResult> {
  return request<SourceIngestionResult>(`/api/sources/${sourceId}/ingest`, {
    method: 'POST'
  });
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    },
    body: formData
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Upload failed: ${message}`);
  }

  return response.json();
}

export async function uploadSourceFile(sourceId: string, file: File): Promise<SourceIngestionResult> {
  const formData = new FormData();
  formData.append('file', file);
  
  return uploadRequest<SourceIngestionResult>(`/api/sources/${sourceId}/upload-file`, formData);
}

export async function submitRetrieval(
  payload: RetrievalRequest
): Promise<RetrievalResult> {
  return request<RetrievalResult>('/api/retrieval/query', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function generateDraft(
  payload: SectionDraftRequest
): Promise<SectionDraftResponse> {
  return request<SectionDraftResponse>('/api/drafting/section', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function requestParagraphRewrite(
  payload: RewriteDraftRequest
): Promise<RewriteDraftResponse> {
  return request<RewriteDraftResponse>('/api/drafting/rewrite', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
