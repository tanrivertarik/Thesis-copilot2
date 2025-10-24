import { getFirestore } from 'firebase-admin/firestore';
import type { SourceIngestionResult } from '@thesis-copilot/shared';
import { createSource } from './source-service.js';
import { scrapeWebPage, type ScrapedContent } from './web-scraping-service.js';
import { downloadPDF, type AcademicPaper } from './semantic-scholar-service.js';
import { createEmbeddings } from '../ai/openrouter.js';
import { logger } from '../utils/logger.js';
import { SourceProcessingError, ErrorCode } from '../utils/errors.js';

const CHUNK_SIZE = 800; // tokens per chunk
const CHUNK_OVERLAP = 100; // overlap between chunks

type ContentSource = {
  type: 'pdf' | 'webpage' | 'academic-paper';
  data: Buffer | ScrapedContent | AcademicPaper;
  metadata: {
    title: string;
    author?: string;
    url?: string;
    year?: number;
    citationCount?: number;
  };
};

/**
 * Ingest content from various sources (PDFs, web pages, academic papers)
 * and store in the project's knowledge base
 */
export async function ingestContent(
  projectId: string,
  ownerId: string,
  source: ContentSource
): Promise<SourceIngestionResult> {
  logger.info('Starting content ingestion', {
    projectId,
    type: source.type,
    title: source.metadata.title
  });

  try {
    // Step 1: Create source record
    const sourceRecord = await createSource(ownerId, {
      projectId,
      kind: source.type === 'pdf' || source.type === 'academic-paper' ? 'PDF' : 'WEB_PAGE',
      metadata: {
        title: source.metadata.title,
        author: source.metadata.author,
        url: source.metadata.url,
        publicationYear: source.metadata.year,
        citationCount: source.metadata.citationCount,
        ingestedAt: new Date().toISOString()
      }
    });

    // Step 2: Extract text based on source type
    let text: string;
    let wordCount: number;

    if (source.type === 'webpage' && 'content' in source.data) {
      text = source.data.content;
      wordCount = source.data.metadata.wordCount;
    } else if (source.type === 'academic-paper' && 'abstract' in source.data) {
      // For academic papers, download PDF if available
      if (source.data.pdfUrl) {
        try {
          const pdfBuffer = await downloadPDF(source.data.pdfUrl);
          const pdfParse = await import('pdf-parse');
          const parsed = await pdfParse.default(pdfBuffer);
          text = parsed.text;
          wordCount = text.split(/\s+/).length;
        } catch (error) {
          logger.warn('PDF download failed, using abstract only', {
            paperId: source.data.id,
            error
          });
          // Fallback to abstract if PDF fails
          text = `${source.data.title}\n\n${source.data.abstract || ''}`;
          wordCount = text.split(/\s+/).length;
        }
      } else {
        // No PDF available, use abstract
        text = `${source.data.title}\n\n${source.data.abstract || ''}`;
        wordCount = text.split(/\s+/).length;
      }
    } else if (source.type === 'pdf' && Buffer.isBuffer(source.data)) {
      const pdfParse = await import('pdf-parse');
      const parsed = await pdfParse.default(source.data);
      text = parsed.text;
      wordCount = text.split(/\s+/).length;
    } else {
      throw new Error('Invalid source data format');
    }

    // Step 3: Chunk text
    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);

    logger.info('Text chunked', {
      sourceId: sourceRecord.id,
      wordCount,
      chunkCount: chunks.length
    });

    // Step 4: Generate embeddings in batches
    const embeddedChunks = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchTexts = batch.map(c => c.text);

      logger.debug('Generating embeddings for batch');

      const embeddingResult = await createEmbeddings(batchTexts);

      batch.forEach((chunk, idx) => {
        embeddedChunks.push({
          id: `${sourceRecord.id}_chunk_${i + idx}`,
          sourceId: sourceRecord.id,
          projectId,
          text: chunk.text,
          embedding: embeddingResult.embeddings[idx],
          metadata: {
            position: i + idx,
            tokenCount: chunk.tokenCount,
            startChar: chunk.startChar,
            endChar: chunk.endChar
          },
          createdAt: new Date().toISOString()
        });
      });
    }

    // Step 5: Save chunks to Firestore
    const db = getFirestore();
    const chunksCollection = db.collection('source_chunks');

    // Batch write chunks (Firestore limit: 500 operations per batch)
    const FIRESTORE_BATCH_SIZE = 500;
    for (let i = 0; i < embeddedChunks.length; i += FIRESTORE_BATCH_SIZE) {
      const batch = db.batch();
      const batchChunks = embeddedChunks.slice(i, i + FIRESTORE_BATCH_SIZE);

      for (const chunk of batchChunks) {
        const docRef = chunksCollection.doc(chunk.id);
        batch.set(docRef, chunk);
      }

      await batch.commit();
    }

    logger.info('Content ingestion completed', {
      sourceId: sourceRecord.id,
      chunkCount: embeddedChunks.length
    });

    return {
      sourceId: sourceRecord.id,
      chunkCount: embeddedChunks.length,
      summary: {
        abstract: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        wordCount
      }
    };
  } catch (error) {
    logger.error('Content ingestion failed', error);

    throw new SourceProcessingError(
      ErrorCode.SOURCE_INGESTION_FAILED,
      `Failed to ingest content: ${(error as Error).message}`,
      { projectId, additionalData: { type: source.type } },
      error as Error
    );
  }
}

/**
 * Chunk text into overlapping segments
 */
function chunkText(
  text: string,
  maxTokens: number,
  overlap: number
): Array<{ text: string; tokenCount: number; startChar: number; endChar: number }> {
  // Approximate: 1 token ≈ 4 characters
  const charsPerToken = 4;
  const maxChars = maxTokens * charsPerToken;
  const overlapChars = overlap * charsPerToken;

  const chunks = [];
  let startChar = 0;

  while (startChar < text.length) {
    const endChar = Math.min(startChar + maxChars, text.length);
    let chunkText = text.substring(startChar, endChar);

    // Try to end at sentence boundary if possible
    if (endChar < text.length) {
      const lastPeriod = chunkText.lastIndexOf('.');
      const lastNewline = chunkText.lastIndexOf('\n');
      const boundary = Math.max(lastPeriod, lastNewline);

      if (boundary > maxChars * 0.7) { // Only adjust if we're not losing too much
        chunkText = chunkText.substring(0, boundary + 1);
      }
    }

    chunks.push({
      text: chunkText.trim(),
      tokenCount: Math.ceil(chunkText.length / charsPerToken),
      startChar,
      endChar: startChar + chunkText.length
    });

    // Move start position with overlap
    startChar += chunkText.length - overlapChars;

    // Prevent infinite loop
    if (startChar >= endChar) {
      break;
    }
  }

  return chunks;
}

/**
 * Ingest an academic paper from Semantic Scholar
 */
export async function ingestAcademicPaper(
  projectId: string,
  ownerId: string,
  paper: AcademicPaper
): Promise<SourceIngestionResult> {
  return await ingestContent(projectId, ownerId, {
    type: 'academic-paper',
    data: paper,
    metadata: {
      title: paper.title,
      author: paper.authors,
      url: paper.sourceUrl,
      year: paper.year || undefined,
      citationCount: paper.citationCount
    }
  });
}

/**
 * Ingest a web page
 */
export async function ingestWebPage(
  projectId: string,
  ownerId: string,
  url: string
): Promise<SourceIngestionResult> {
  // Scrape the page first
  const scrapedContent = await scrapeWebPage(url);

  return await ingestContent(projectId, ownerId, {
    type: 'webpage',
    data: scrapedContent,
    metadata: {
      title: scrapedContent.title,
      author: scrapedContent.metadata.author,
      url: scrapedContent.url
    }
  });
}

/**
 * Batch ingest multiple academic papers
 */
export async function ingestMultiplePapers(
  projectId: string,
  ownerId: string,
  papers: AcademicPaper[],
  onProgress?: (completed: number, total: number) => void
): Promise<SourceIngestionResult[]> {
  logger.info('Batch ingesting papers', { projectId, count: papers.length });

  const results: SourceIngestionResult[] = [];

  for (let i = 0; i < papers.length; i++) {
    try {
      const result = await ingestAcademicPaper(projectId, ownerId, papers[i]);
      results.push(result);

      if (onProgress) {
        onProgress(i + 1, papers.length);
      }
    } catch (error) {
      logger.error('Failed to ingest paper', {
        paperId: papers[i].id,
        error
      });
      // Continue with other papers even if one fails
    }
  }

  logger.info('Batch ingestion completed', {
    projectId,
    successful: results.length,
    failed: papers.length - results.length
  });

  return results;
}
