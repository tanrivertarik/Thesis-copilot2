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
  SourceIngestionResult,
  ThesisConstitution,
  AICommandRequest,
  AICommandResponse
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

export async function restoreDraftVersion(
  projectId: string,
  sectionId: string,
  versionId: string
): Promise<Draft> {
  return request<Draft>(`/api/projects/${projectId}/drafts/${sectionId}/restore/${versionId}`, {
    method: 'POST'
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

export async function processAICommand(
  payload: AICommandRequest
): Promise<AICommandResponse> {
  return request<AICommandResponse>('/api/drafting/command', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export type AcademicLevel = 'UNDERGRADUATE' | 'MASTERS' | 'PHD';

export type ConstitutionGenerationPayload = {
  academicLevel: AcademicLevel;
  discipline: string;
  includeExistingSources?: boolean;
};

export type ConstitutionGenerationResult = {
  constitution: ThesisConstitution;
  metadata: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    academicLevel: string;
    discipline: string;
    sourcesIncluded: number;
  };
};

export type ConstitutionSuggestions = {
  suggestedAcademicLevel: AcademicLevel;
  suggestedDiscipline: string;
  reasoning: string;
  sourcesAvailable: number;
};

export async function generateProjectConstitution(
  projectId: string,
  payload: ConstitutionGenerationPayload
): Promise<ConstitutionGenerationResult> {
  return request<ConstitutionGenerationResult>(`/api/projects/${projectId}/constitution/generate`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchConstitutionSuggestions(
  projectId: string
): Promise<ConstitutionSuggestions> {
  return request<ConstitutionSuggestions>(`/api/projects/${projectId}/constitution/suggestions`);
}

/**
 * Download section as DOCX file
 */
export async function downloadSectionDocx(projectId: string, sectionId: string): Promise<void> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/projects/${projectId}/sections/${sectionId}/export`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Export failed: ${message}`);
  }

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const filename = filenameMatch ? filenameMatch[1] : 'section.docx';

  // Create blob and trigger download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Download entire project as DOCX file
 */
export async function downloadProjectDocx(projectId: string): Promise<void> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/export`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Export failed: ${message}`);
  }

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const filename = filenameMatch ? filenameMatch[1] : 'thesis.docx';

  // Create blob and trigger download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
