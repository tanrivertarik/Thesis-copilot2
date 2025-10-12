import type {
  Project,
  RetrievalRequest,
  RetrievalResult,
  SectionDraftRequest,
  SectionDraftResponse
} from '@thesis-copilot/shared';
import { env } from './env';

const API_BASE_URL = env.apiBaseUrl;
const DEFAULT_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  'x-user-id': 'demo-user'
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
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

export async function fetchSources(projectId: string) {
  return request(`/api/projects/${projectId}/sources`);
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
