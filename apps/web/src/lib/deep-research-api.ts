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

/**
 * Generate a research plan from a user query with project context
 */
export async function generateResearchPlan(
  query: string,
  projectId?: string
): Promise<ResearchPlan> {
  return await request<ResearchPlan>('/api/research/plan', {
    method: 'POST',
    body: JSON.stringify({ query, projectId })
  });
}

/**
 * Refine an existing research plan based on user feedback with project context
 */
export async function refineResearchPlan(
  planId: string,
  existingPlan: ResearchPlan,
  feedback: string,
  projectId?: string
): Promise<ResearchPlan> {
  return await request<ResearchPlan>(
    `/api/research/plan/${planId}/refine`,
    {
      method: 'POST',
      body: JSON.stringify({ existingPlan, feedback, projectId })
    }
  );
}

/**
 * Search for academic papers using Semantic Scholar with AI relevance filtering
 */
export async function searchAcademicPapers(
  query: string,
  options?: {
    limit?: number;
    minCitations?: number;
    yearFrom?: number;
    yearTo?: number;
  },
  researchContext?: {
    mainQuery: string;
    domain: string;
  }
): Promise<AcademicPaper[]> {
  const response = await request<{ papers: AcademicPaper[] }>(
    '/api/research/search/academic',
    {
      method: 'POST',
      body: JSON.stringify({ query, options, researchContext })
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
