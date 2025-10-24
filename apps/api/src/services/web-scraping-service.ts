import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { AIServiceError, ErrorCode } from '../utils/errors.js';

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
 * Scrape and extract main content from a web page using Cheerio
 * Works best for static HTML pages
 */
export async function scrapeWebPage(url: string): Promise<ScrapedContent> {
  logger.info('Scraping web page', { url });

  try {
    // Fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract content using Cheerio
    return extractContent(html, url);
  } catch (error) {
    logger.error('Web scraping failed', error);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new AIServiceError(
        ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
        'Request timeout: Page took too long to load',
        { additionalData: { url } },
        error
      );
    }

    throw new AIServiceError(
      ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      `Failed to scrape webpage: ${(error as Error).message}`,
      { additionalData: { url } },
      error as Error
    );
  }
}

/**
 * Extract structured content from HTML using Cheerio
 */
function extractContent(html: string, url: string): ScrapedContent {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, iframe, noscript, .nav, .menu, .sidebar, .advertisement, .ads, .comments').remove();

  // Extract metadata
  const title = extractTitle($);
  const author = extractAuthor($);
  const publishDate = extractPublishDate($);
  const description = extractDescription($);

  // Extract main content
  const content = extractMainContent($);

  // Clean up whitespace
  const cleanContent = content.replace(/\s+/g, ' ').trim();
  const wordCount = cleanContent.split(' ').filter(w => w.length > 0).length;

  logger.info('Content extracted', {
    url,
    title,
    wordCount,
    hasAuthor: !!author,
    hasDate: !!publishDate
  });

  return {
    title,
    content: cleanContent,
    url,
    metadata: {
      scrapedAt: new Date().toISOString(),
      wordCount,
      author: author || undefined,
      publishDate: publishDate || undefined,
      description: description || undefined
    }
  };
}

/**
 * Extract title from various sources
 */
function extractTitle($: cheerio.CheerioAPI): string {
  // Try different title sources in order of preference
  const titleCandidates = [
    $('article h1').first().text(),
    $('h1').first().text(),
    $('meta[property="og:title"]').attr('content'),
    $('meta[name="twitter:title"]').attr('content'),
    $('title').text(),
  ];

  for (const candidate of titleCandidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return 'Untitled Document';
}

/**
 * Extract author information
 */
function extractAuthor($: cheerio.CheerioAPI): string | null {
  const authorCandidates = [
    $('meta[name="author"]').attr('content'),
    $('meta[property="article:author"]').attr('content'),
    $('.author').first().text(),
    $('[rel="author"]').first().text(),
    $('[itemprop="author"]').first().text(),
  ];

  for (const candidate of authorCandidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

/**
 * Extract publication date
 */
function extractPublishDate($: cheerio.CheerioAPI): string | null {
  const dateCandidates = [
    $('meta[property="article:published_time"]').attr('content'),
    $('meta[name="publish-date"]').attr('content'),
    $('time[datetime]').attr('datetime'),
    $('[itemprop="datePublished"]').attr('content'),
    $('.publish-date').first().text(),
  ];

  for (const candidate of dateCandidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

/**
 * Extract meta description
 */
function extractDescription($: cheerio.CheerioAPI): string | null {
  const descriptionCandidates = [
    $('meta[name="description"]').attr('content'),
    $('meta[property="og:description"]').attr('content'),
    $('meta[name="twitter:description"]').attr('content'),
  ];

  for (const candidate of descriptionCandidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

/**
 * Extract main content using smart selectors
 */
function extractMainContent($: cheerio.CheerioAPI): string {
  // Try to find main content container using common selectors
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content',
    '#content',
    '.main-content',
    '.page-content'
  ];

  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const text = element.text();
      // Check if content is substantial (at least 200 characters)
      if (text.length > 200) {
        return text;
      }
    }
  }

  // Fallback: get all paragraphs
  const paragraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 50) { // Only include substantial paragraphs
      paragraphs.push(text);
    }
  });

  if (paragraphs.length > 0) {
    return paragraphs.join('\n\n');
  }

  // Last resort: get body text (excluding already removed elements)
  return $('body').text();
}

/**
 * Check if URL is scrapable (not blocked, not requiring JS)
 */
export function isScrapable(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Block certain domains that require authentication or are unfriendly to scraping
    const blockedDomains = [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com',
      'youtube.com',
      'tiktok.com'
    ];

    for (const blocked of blockedDomains) {
      if (urlObj.hostname.includes(blocked)) {
        return false;
      }
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Batch scrape multiple URLs with rate limiting
 */
export async function scrapeMultiplePages(
  urls: string[],
  options: { delayMs?: number; maxConcurrent?: number } = {}
): Promise<(ScrapedContent | null)[]> {
  const { delayMs = 2000, maxConcurrent = 3 } = options;

  logger.info('Batch scraping pages', { count: urls.length, maxConcurrent });

  const results: (ScrapedContent | null)[] = [];
  const filteredUrls = urls.filter(isScrapable);

  // Process in batches to respect rate limits
  for (let i = 0; i < filteredUrls.length; i += maxConcurrent) {
    const batch = filteredUrls.slice(i, i + maxConcurrent);

    const batchResults = await Promise.allSettled(
      batch.map(url => scrapeWebPage(url))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        logger.warn('Scraping failed for URL', { error: result.reason });
        results.push(null);
      }
    }

    // Rate limiting delay between batches
    if (i + maxConcurrent < filteredUrls.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  logger.info('Batch scraping completed', {
    total: urls.length,
    successful: results.filter(r => r !== null).length,
    failed: results.filter(r => r === null).length
  });

  return results;
}
