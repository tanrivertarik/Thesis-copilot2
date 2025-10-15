import { randomUUID } from 'crypto';
import type {
  Source,
  SourceCreateInput,
  SourceIngestionResult,
  SourceChunk,
  SourceUploadInput
} from '@thesis-copilot/shared';
import {
  SourceStatusSchema,
  SourceSchema,
  SourceSummarySchema
} from '@thesis-copilot/shared';
import { createEmbeddings, generateChatCompletion } from '../ai/openrouter.js';
import { getFirestore } from '../lib/firestore.js';
import { chunkText } from './text-utils.js';
import {
  ErrorCode,
  ErrorFactory,
  ThesisError,
  DatabaseError,
  ValidationError,
  SourceProcessingError,
  withRetry
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const SOURCES_COLLECTION = 'sources';
const SOURCE_UPLOADS_COLLECTION = 'sourceUploads';
const SOURCE_CHUNKS_COLLECTION = 'sourceChunks';

function docToSource(
  snapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): Source | null {
  if (!snapshot.exists) {
    return null;
  }
  const data = snapshot.data();
  const parsed = SourceSchema.safeParse({ id: snapshot.id, ...data });
  if (!parsed.success) {
    const error = new ValidationError(
      ErrorCode.VALIDATION_ERROR,
      'Failed to parse source document from database',
      { 
        sourceId: snapshot.id,
        additionalData: { validationErrors: parsed.error.format() }
      }
    );
    logger.error('Failed to parse source document', error);
    return null;
  }
  return parsed.data;
}

async function deleteExistingChunks(sourceId: string) {
  const startTime = performance.now();
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection(SOURCE_CHUNKS_COLLECTION)
      .where('sourceId', '==', sourceId)
      .get();

    if (snapshot.empty) {
      logger.info('No existing chunks to delete', { sourceId });
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    const duration = performance.now() - startTime;
    logger.logMetrics('delete_existing_chunks', duration, { sourceId }, {
      deletedCount: snapshot.docs.length
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    const thesisError = new DatabaseError(
      ErrorCode.DATABASE_ERROR,
      'Failed to delete existing source chunks',
      { sourceId }
    );
    logger.error('Failed to delete existing chunks', thesisError, {
      additionalData: { duration, originalError: error }
    });
    throw thesisError;
  }
}

export async function listSources(ownerId: string, projectId: string): Promise<Source[]> {
  const startTime = performance.now();
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection(SOURCES_COLLECTION)
      .where('ownerId', '==', ownerId)
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .get();

    const sources = snapshot.docs
      .map(docToSource)
      .filter((source): source is Source => Boolean(source));

    const duration = performance.now() - startTime;
    logger.logMetrics('list_sources', duration, { userId: ownerId, projectId }, {
      sourceCount: sources.length
    });

    return sources;
  } catch (error) {
    const thesisError = ErrorFactory.fromUnknown(error, ErrorCode.DATABASE_ERROR, {
      userId: ownerId,
      projectId,
      additionalData: { operation: 'list_sources' }
    });
    logger.error('Failed to list sources', thesisError);
    throw thesisError;
  }
}

export async function createSource(
  ownerId: string,
  input: SourceCreateInput
): Promise<Source> {
  const startTime = performance.now();
  try {
    const db = getFirestore();
    const now = new Date().toISOString();
    const id = randomUUID();

    const source: Source = {
      id,
      ownerId,
      projectId: input.projectId,
      kind: input.kind,
      status: input.upload ? 'PROCESSING' : 'UPLOADED',
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now
    };

    await db.collection(SOURCES_COLLECTION).doc(id).set(source);

    if (input.upload) {
      await uploadSourceContent(ownerId, id, input.upload);
    }

    const duration = performance.now() - startTime;
    logger.logMetrics('create_source', duration, { 
      userId: ownerId, 
      projectId: input.projectId,
      sourceId: id 
    }, {
      hasUpload: !!input.upload,
      sourceKind: input.kind
    });

    return source;
  } catch (error) {
    const thesisError = ErrorFactory.fromUnknown(error, ErrorCode.DATABASE_ERROR, {
      userId: ownerId,
      projectId: input.projectId,
      additionalData: { operation: 'create_source', sourceKind: input.kind }
    });
    logger.error('Failed to create source', thesisError);
    throw thesisError;
  }
}

export async function uploadSourceContent(
  ownerId: string,
  sourceId: string,
  payload: SourceUploadInput
): Promise<boolean> {
  const startTime = performance.now();
  try {
    const db = getFirestore();
    const sourceDoc = await db.collection(SOURCES_COLLECTION).doc(sourceId).get();
    const source = docToSource(sourceDoc);
    
    if (!source || source.ownerId !== ownerId) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Source not found or access denied',
        { userId: ownerId, sourceId }
      );
    }

    await db
      .collection(SOURCE_UPLOADS_COLLECTION)
      .doc(sourceId)
      .set({ ownerId, projectId: source.projectId, ...payload, createdAt: new Date().toISOString() });

    await db
      .collection(SOURCES_COLLECTION)
      .doc(sourceId)
      .set({ status: 'PROCESSING', updatedAt: new Date().toISOString() }, { merge: true });

    const duration = performance.now() - startTime;
    logger.logMetrics('upload_source_content', duration, { 
      userId: ownerId, 
      sourceId,
      projectId: source.projectId 
    });

    return true;
  } catch (error) {
    if (error instanceof ThesisError) {
      throw error;
    }
    
    const thesisError = ErrorFactory.fromUnknown(error, ErrorCode.STORAGE_ERROR, {
      userId: ownerId,
      sourceId,
      additionalData: { operation: 'upload_source_content' }
    });
    logger.error('Failed to upload source content', thesisError);
    throw thesisError;
  }
}

export async function ingestSource(
  ownerId: string,
  sourceId: string
): Promise<SourceIngestionResult | null> {
  const db = getFirestore();
  const sourceDocRef = db.collection(SOURCES_COLLECTION).doc(sourceId);
  const sourceSnapshot = await sourceDocRef.get();
  const source = docToSource(sourceSnapshot);
  if (!source || source.ownerId !== ownerId) {
    return null;
  }

  const payloadSnapshot = await db.collection(SOURCE_UPLOADS_COLLECTION).doc(sourceId).get();
  const payload = payloadSnapshot.data() as (SourceUploadInput & { data: string }) | undefined;
  if (!payload) {
    return {
      sourceId,
      status: source.status,
      error: {
        code: 'MISSING_UPLOAD',
        message: 'No uploaded data found for source. Call /sources/:id/upload before ingest.'
      }
    };
  }

  const extractedText = await extractText(payload);

  return processIngestionWithExtractedText({
    db,
    source,
    sourceDocRef,
    sourceId,
    extractedText
  });
}

export async function getChunksForProject(projectId: string): Promise<SourceChunk[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection(SOURCE_CHUNKS_COLLECTION)
    .where('projectId', '==', projectId)
    .orderBy('order')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as SourceChunk;
    return { ...data, id: doc.id };
  });
}

export async function updateSourceStatus(sourceId: string, status: string): Promise<void> {
  const db = getFirestore();
  const parsed = SourceStatusSchema.safeParse(status);
  if (!parsed.success) {
    throw new Error(`Invalid source status supplied: ${status}`);
  }
  await db
    .collection(SOURCES_COLLECTION)
    .doc(sourceId)
    .set({ status: parsed.data, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function uploadSourceFile(
  ownerId: string,
  sourceId: string,
  file: { filepath: string; mimetype?: string; originalFilename?: string }
): Promise<SourceIngestionResult | null> {
  const db = getFirestore();
  const sourceDoc = await db.collection(SOURCES_COLLECTION).doc(sourceId).get();
  const source = docToSource(sourceDoc);
  if (!source || source.ownerId !== ownerId) {
    return null;
  }

  try {
    // Read file and process based on type
    const fs = await import('fs/promises');
    const fileBuffer = await fs.readFile(file.filepath);
    
    let extractedText: { text: string; wordCount: number };

    if (file.mimetype === 'application/pdf' || file.originalFilename?.toLowerCase().endsWith('.pdf')) {
      const pdfParseFn = await loadPdfParser();
      const pdf = await pdfParseFn(fileBuffer);
      extractedText = { text: pdf.text, wordCount: pdf.text.split(/\s+/).length };
    } else {
      // Treat as text file
      const text = fileBuffer.toString('utf-8');
      extractedText = { text, wordCount: text.split(/\s+/).length };
    }

    await db
      .collection(SOURCES_COLLECTION)
      .doc(sourceId)
      .set({ status: 'PROCESSING', updatedAt: new Date().toISOString() }, { merge: true });

    const result = await processIngestionWithExtractedText({
      db,
      source,
      sourceDocRef: sourceDoc.ref,
      sourceId,
      extractedText
    });

    return result;
  } catch (error) {
    // Update source status to indicate failure
    await db
      .collection(SOURCES_COLLECTION)
      .doc(sourceId)
      .set({ status: 'FAILED', updatedAt: new Date().toISOString() }, { merge: true });
    
    throw error;
  }
}

async function processIngestionWithExtractedText({
  db,
  source,
  sourceDocRef,
  sourceId,
  extractedText
}: {
  db: FirebaseFirestore.Firestore;
  source: Source;
  sourceDocRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
  sourceId: string;
  extractedText: { text: string; wordCount: number };
}): Promise<SourceIngestionResult> {
  const extractionStart = Date.now();
  const chunks = chunkText(extractedText.text, 800);

  // Generate embeddings with batch processing and retry logic
  let embeddings: number[][];
  let embeddingLatency = 0;
  let embeddingUsage: any;
  let cached = false;
  let embeddingModelName: string | undefined;

  try {
    console.info(`[ingestion] Generating embeddings for ${chunks.length} chunks`);

    const BATCH_SIZE = 50;
    const allEmbeddings: number[][] = [];
    let totalLatency = 0;
    let totalUsage: any = {};

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      const batchTexts = batchChunks.map((chunk) => chunk.text);

      console.info(
        `[ingestion] Processing embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`
      );

      const batchResult = await createEmbeddings(batchTexts);
      if (!embeddingModelName) {
        embeddingModelName = batchResult.model;
      }
      allEmbeddings.push(...batchResult.embeddings);
      totalLatency += batchResult.latencyMs;
      cached = cached || batchResult.cached;

      if (batchResult.usage) {
        totalUsage.promptTokens = (totalUsage.promptTokens || 0) + (batchResult.usage.promptTokens || 0);
        totalUsage.totalTokens = (totalUsage.totalTokens || 0) + (batchResult.usage.totalTokens || 0);
      }

      if (i + BATCH_SIZE < chunks.length && !cached) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    embeddings = allEmbeddings;
    embeddingLatency = totalLatency;
    embeddingUsage = totalUsage;

    if (embeddingUsage) {
      console.info(
        '[ingestion] embedding usage',
        JSON.stringify(
          {
            sourceId,
            ...embeddingUsage,
            cached,
            batches: Math.ceil(chunks.length / BATCH_SIZE),
            model: embeddingModelName
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    console.error(`[ingestion] Embedding generation failed for ${sourceId}:`, error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (embeddings.length !== chunks.length) {
    throw new Error(`Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`);
  }

  const summaryText = extractedText.text.slice(0, 8000);
  const wordCount = extractedText.wordCount;

  const summaryResponse = await generateChatCompletion({
    model: 'openai/gpt-4o-mini',
    systemPrompt: `You are an expert academic research assistant. Your task is to create high-quality summaries of academic sources that will help thesis writers understand and cite the content effectively.

Guidelines:
- Write a concise but comprehensive abstract (2-4 sentences)
- Extract 4-6 key insights that would be useful for thesis research
- Focus on methodology, findings, arguments, and implications
- Use clear, academic language
- Return ONLY valid JSON in the specified format`,
    userPrompt: `Analyze this academic source and create a structured summary.

Source Title: ${source.metadata.title || 'Untitled'}
Author: ${source.metadata.author || 'Unknown'}
Word Count: ~${wordCount} words

Content:
${summaryText}

Return JSON with this exact structure:
{
  "abstract": "A concise 2-4 sentence summary of the main content and contributions",
  "bulletPoints": [
    "Key insight or finding #1",
    "Key insight or finding #2", 
    "Key insight or finding #3",
    "Key insight or finding #4"
  ]
}`,
    maxTokens: 500,
    temperature: 0.1
  });

  if (summaryResponse.usage) {
    console.info(
      '[ingestion] summarization usage',
      JSON.stringify(
        {
          sourceId,
          ...summaryResponse.usage,
          cached: summaryResponse.cached,
          latencyMs: summaryResponse.latencyMs
        },
        null,
        2
      )
    );
  }

  let summary = source.summary;
  try {
    let responseText = summaryResponse.output.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    const parsed = SourceSummarySchema.parse(JSON.parse(responseText));
    summary = parsed;
  } catch (error) {
    console.warn(`[ingestion] Failed to parse summary for ${sourceId}:`, error);
    summary = {
      abstract: summaryText.slice(0, 300) + '...',
      bulletPoints: [
        'Failed to generate structured summary',
        `Source contains approximately ${wordCount} words`,
        'Manual review recommended for key insights'
      ]
    };
  }

  const sourceChunks: SourceChunk[] = chunks.map((chunk, index) => {
    const metadata: Record<string, unknown> = {};
    if (chunk.heading) {
      metadata.heading = chunk.heading;
    }
    if (chunk.pageRange) {
      metadata.pageRange = chunk.pageRange;
    }

    return {
      id: randomUUID(),
      sourceId,
      projectId: source.projectId,
      order: index,
      text: chunk.text,
      tokenCount: chunk.approxTokenCount,
      embedding: embeddings[index],
      ...(Object.keys(metadata).length > 0 ? { metadata } : {})
    };
  });

  console.info(`[ingestion] Cleaning up existing chunks for ${sourceId}`);
  await deleteExistingChunks(sourceId);

  console.info(`[ingestion] Storing ${sourceChunks.length} chunks for ${sourceId}`);
  const FIRESTORE_BATCH_SIZE = 400;

  try {
    for (let i = 0; i < sourceChunks.length; i += FIRESTORE_BATCH_SIZE) {
      const batchChunks = sourceChunks.slice(i, i + FIRESTORE_BATCH_SIZE);
      const batch = db.batch();

      batchChunks.forEach((chunk) => {
        const ref = db.collection(SOURCE_CHUNKS_COLLECTION).doc(chunk.id);
        batch.set(ref, chunk);
      });

      await batch.commit();
      console.info(
        `[ingestion] Stored chunk batch ${Math.floor(i / FIRESTORE_BATCH_SIZE) + 1}/${Math.ceil(
          sourceChunks.length / FIRESTORE_BATCH_SIZE
        )}`
      );
    }

    const finalBatch = db.batch();
    finalBatch.set(
      sourceDocRef,
      {
        status: 'READY',
        summary,
        embeddingModel: embeddingModelName ?? 'mock-embedding',
        chunkCount: sourceChunks.length,
        totalTokens: sourceChunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0),
        updatedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        embeddingLatencyMs: embeddingLatency
      },
      { merge: true }
    );

    finalBatch.delete(db.collection(SOURCE_UPLOADS_COLLECTION).doc(sourceId));
    await finalBatch.commit();

    console.info(`[ingestion] Successfully processed source ${sourceId} with ${sourceChunks.length} chunks`);
  } catch (error) {
    console.error(`[ingestion] Failed to store chunks for ${sourceId}:`, error);
    await sourceDocRef.set(
      {
        status: 'FAILED',
        updatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown storage error'
      },
      { merge: true }
    );
    throw error;
  }

  const processingTime = Date.now() - extractionStart;

  return {
    sourceId,
    status: 'READY',
    summary,
    embeddingModel: embeddingModelName ?? 'mock-embedding',
    chunkCount: sourceChunks.length,
    processingTimeMs: processingTime
  };
}

async function extractText(payload: SourceUploadInput): Promise<{
  text: string;
  wordCount: number;
}> {
  if (payload.contentType === 'TEXT') {
    const text = payload.data;
    return { text, wordCount: text.split(/\s+/).length };
  }

  const buffer = Buffer.from(payload.data, 'base64');
  const pdfParseFn = await loadPdfParser();
  const pdf = await pdfParseFn(buffer);
  return { text: pdf.text, wordCount: pdf.text.split(/\s+/).length };
}

type PdfParseFn = (data: Buffer) => Promise<{ text: string }>;

async function loadPdfParser(): Promise<PdfParseFn> {
  const pdfModule = await import('pdf-parse');
  const legacyFn = (pdfModule as { default?: unknown }).default;
  if (typeof legacyFn === 'function') {
    return legacyFn as PdfParseFn;
  }

  const ParserClass = (pdfModule as { PDFParse?: unknown }).PDFParse;
  if (typeof ParserClass === 'function') {
    return async (data: Buffer) => {
      const parser = new (ParserClass as new (options: { data: Uint8Array | Buffer }) => {
        getText: () => Promise<{ text: string }>;
        destroy?: () => Promise<void>;
      })({ data });

      try {
        const { text } = await parser.getText();
        return { text };
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      }
    };
  }

  throw new Error('pdf-parse module did not export a compatible parser');
}
