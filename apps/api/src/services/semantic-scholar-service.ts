import { logger } from '../utils/logger.js';
import { AIServiceError, ErrorCode } from '../utils/errors.js';

const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';

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

export type SemanticScholarSearchOptions = {
  limit?: number;
  minCitations?: number;
  yearFrom?: number;
  yearTo?: number;
  fieldsOfStudy?: string[];
};

/**
 * Search academic papers using Semantic Scholar API
 * Free tier: 100 requests per 5 minutes
 */
export async function searchSemanticScholar(
  query: string,
  options: SemanticScholarSearchOptions = {}
): Promise<AcademicPaper[]> {
  const {
    limit = 20,
    minCitations = 10,
    yearFrom,
    yearTo
  } = options;

  logger.info('Searching Semantic Scholar', { query, options });

  try {
    // Build query parameters
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
      fields: [
        'paperId',
        'title',
        'authors',
        'year',
        'abstract',
        'citationCount',
        'openAccessPdf',
        'url',
        'venue',
        'publicationDate',
        'fieldsOfStudy'
      ].join(',')
    });

    // Add year filters if provided
    if (yearFrom) {
      params.append('year', `${yearFrom}-`);
    }
    if (yearTo) {
      params.append('year', `-${yearTo}`);
    }

    const response = await fetch(`${SEMANTIC_SCHOLAR_API}/paper/search?${params}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Semantic Scholar API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      logger.warn('Unexpected Semantic Scholar response format', { data });
      return [];
    }

    // Extract query keywords for relevance scoring
    const queryKeywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 3);

    // Filter and transform results with relevance scoring
    const papers: AcademicPaper[] = data.data
      .filter((paper: any) => {
        // Filter by minimum citations
        if (paper.citationCount < minCitations) {
          return false;
        }

        // Relevance check: title and abstract must contain at least 1 query keyword
        if (paper.title || paper.abstract) {
          const paperText = `${paper.title || ''} ${paper.abstract || ''}`.toLowerCase();
          const matchCount = queryKeywords.filter(keyword => paperText.includes(keyword)).length;

          // Require at least 20% of keywords to match (or at least 1 for very short queries)
          const minMatches = Math.max(1, Math.ceil(queryKeywords.length * 0.2));
          if (matchCount < minMatches) {
            logger.debug('Filtering out irrelevant paper', {
              title: paper.title,
              matchCount,
              requiredMatches: minMatches
            });
            return false;
          }
        }

        return true;
      })
      .map((paper: any) => ({
        id: paper.paperId,
        title: paper.title || 'Untitled',
        authors: paper.authors
          ? paper.authors.map((a: any) => a.name).join(', ')
          : 'Unknown',
        year: paper.year,
        abstract: paper.abstract || null,
        citationCount: paper.citationCount || 0,
        pdfUrl: paper.openAccessPdf?.url || null,
        sourceUrl: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
        venue: paper.venue || null,
        publicationDate: paper.publicationDate || null
      }));

    logger.info('Semantic Scholar search completed', {
      query,
      resultsFound: papers.length,
      withPdf: papers.filter(p => p.pdfUrl).length
    });

    return papers;
  } catch (error) {
    logger.error('Semantic Scholar search failed', error);

    throw new AIServiceError(
      ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      `Failed to search academic papers: ${(error as Error).message}`,
      { additionalData: { query, service: 'SemanticScholar' } },
      error as Error
    );
  }
}

/**
 * Get detailed information about a specific paper by ID
 */
export async function getPaperDetails(paperId: string): Promise<AcademicPaper | null> {
  logger.info('Fetching paper details', { paperId });

  try {
    const fields = [
      'paperId',
      'title',
      'authors',
      'year',
      'abstract',
      'citationCount',
      'openAccessPdf',
      'url',
      'venue',
      'publicationDate',
      'references',
      'citations'
    ].join(',');

    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/${paperId}?fields=${fields}`,
      {
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.warn('Paper not found', { paperId });
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const paper = await response.json();

    return {
      id: paper.paperId,
      title: paper.title || 'Untitled',
      authors: paper.authors
        ? paper.authors.map((a: any) => a.name).join(', ')
        : 'Unknown',
      year: paper.year,
      abstract: paper.abstract || null,
      citationCount: paper.citationCount || 0,
      pdfUrl: paper.openAccessPdf?.url || null,
      sourceUrl: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      venue: paper.venue || null,
      publicationDate: paper.publicationDate || null
    };
  } catch (error) {
    logger.error('Failed to fetch paper details', error);
    throw new AIServiceError(
      ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      `Failed to fetch paper details: ${(error as Error).message}`,
      { additionalData: { paperId } },
      error as Error
    );
  }
}

/**
 * Search papers by specific title (for exact match)
 */
export async function searchByTitle(title: string): Promise<AcademicPaper | null> {
  logger.info('Searching paper by title', { title });

  try {
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/search/match?query=${encodeURIComponent(title)}`,
      {
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.paperId) {
      return null;
    }

    // Fetch full details for the matched paper
    return await getPaperDetails(data.paperId);
  } catch (error) {
    logger.error('Title search failed', { error, title });
    return null;
  }
}

/**
 * Download PDF from URL
 */
export async function downloadPDF(pdfUrl: string): Promise<Buffer> {
  logger.info('Downloading PDF', { url: pdfUrl });

  try {
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'ThesisCopilot/1.0 (Research Assistant; contact@thesis-copilot.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.error('PDF download failed', error);
    throw new AIServiceError(
      ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      `Failed to download PDF: ${(error as Error).message}`,
      { additionalData: { url: pdfUrl } },
      error as Error
    );
  }
}

/**
 * Rate limiting helper - respects Semantic Scholar's limits
 * Free tier: 100 requests per 5 minutes = 1 request every 3 seconds
 */
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // 3 seconds

export async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    logger.debug('Rate limiting');
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}
