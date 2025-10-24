import { request } from './api';

export type SubQuestion = {
  id: string;
  question: string;
  searchQueries: string[];
  expectedSources: string[];
};

export type ResearchPlan = {
  id: string;
  mainQuestion: string;
  subQuestions: SubQuestion[];
  createdAt: string;
};

export type AcademicPaper = {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  abstract: string | null;
  citationCount: number;
  pdfUrl: string | null;
  sourceUrl: string;
  venue: string | null;
  publicationDate: string | null;
};

export type ScrapedContent = {
  title: string;
  content: string;
  url: string;
  metadata: {
    scrapedAt: string;
    wordCount: number;
    author?: string;
    publishDate?: string;
    description?: string;
  };
};

export type IngestionResult = {
  sourceId: string;
  chunkCount: number;
  summary: {
    abstract: string;
    wordCount: number;
  };
};

/**
 * Generate a research plan from a user query
 */
export async function generateResearchPlan(
  query: string,
  thesisContext?: {
    scope?: string;
    coreArgument?: string;
    toneGuidelines?: string;
  }
): Promise<ResearchPlan> {
  return await request<ResearchPlan>('/api/research/plan', {
    method: 'POST',
    body: JSON.stringify({ query, thesisContext })
  });
}

/**
 * Refine an existing research plan based on user feedback
 */
export async function refineResearchPlan(
  planId: string,
  existingPlan: ResearchPlan,
  feedback: string
): Promise<ResearchPlan> {
  return await request<ResearchPlan>(
    `/api/research/plan/${planId}/refine`,
    {
      method: 'POST',
      body: JSON.stringify({ existingPlan, feedback })
    }
  );
}

/**
 * Search for academic papers using Semantic Scholar
 */
export async function searchAcademicPapers(
  query: string,
  options?: {
    limit?: number;
    minCitations?: number;
    yearFrom?: number;
    yearTo?: number;
  }
): Promise<AcademicPaper[]> {
  const response = await request<{ papers: AcademicPaper[] }>(
    '/api/research/search/academic',
    {
      method: 'POST',
      body: JSON.stringify({ query, options })
    }
  );

  return response.papers;
}

/**
 * Scrape content from a single web page
 */
export async function scrapeWebPage(url: string): Promise<ScrapedContent> {
  return await request<ScrapedContent>('/api/research/scrape', {
    method: 'POST',
    body: JSON.stringify({ url })
  });
}

/**
 * Scrape multiple web pages
 */
export async function scrapeMultiplePages(
  urls: string[],
  options?: { delayMs?: number; maxConcurrent?: number }
): Promise<(ScrapedContent | null)[]> {
  const response = await request<{ results: (ScrapedContent | null)[] }>(
    '/api/research/scrape/batch',
    {
      method: 'POST',
      body: JSON.stringify({ urls, options })
    }
  );

  return response.results;
}

/**
 * Ingest a single academic paper
 */
export async function ingestAcademicPaper(
  projectId: string,
  paper: AcademicPaper
): Promise<IngestionResult> {
  const response = await request<{ data: IngestionResult }>(
    '/api/research/ingest/paper',
    {
      method: 'POST',
      body: JSON.stringify({ projectId, paper })
    }
  );

  return response.data;
}

/**
 * Ingest multiple academic papers
 */
export async function ingestMultiplePapers(
  projectId: string,
  papers: AcademicPaper[]
): Promise<IngestionResult[]> {
  const response = await request<{ data: { results: IngestionResult[] } }>(
    '/api/research/ingest/papers',
    {
      method: 'POST',
      body: JSON.stringify({ projectId, papers })
    }
  );

  return response.data.results;
}

/**
 * Ingest content from a web page
 */
export async function ingestWebPage(
  projectId: string,
  url: string
): Promise<IngestionResult> {
  const response = await request<{ data: IngestionResult }>(
    '/api/research/ingest/webpage',
    {
      method: 'POST',
      body: JSON.stringify({ projectId, url })
    }
  );

  return response.data;
}
