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
    console.error('[source-service] Failed to parse source document', parsed.error.format());
    return null;
  }
  return parsed.data;
}

async function deleteExistingChunks(sourceId: string) {
  const db = getFirestore();
  const snapshot = await db
    .collection(SOURCE_CHUNKS_COLLECTION)
    .where('sourceId', '==', sourceId)
    .get();

  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

export async function listSources(ownerId: string, projectId: string): Promise<Source[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection(SOURCES_COLLECTION)
    .where('ownerId', '==', ownerId)
    .where('projectId', '==', projectId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs
    .map(docToSource)
    .filter((source): source is Source => Boolean(source));
}

export async function createSource(
  ownerId: string,
  input: SourceCreateInput
): Promise<Source> {
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
    summary: undefined,
    createdAt: now,
    updatedAt: now
  };

  await db.collection(SOURCES_COLLECTION).doc(id).set(source);

  if (input.upload) {
    await uploadSourceContent(ownerId, id, input.upload);
  }

  return source;
}

export async function uploadSourceContent(
  ownerId: string,
  sourceId: string,
  payload: SourceUploadInput
): Promise<boolean> {
  const db = getFirestore();
  const sourceDoc = await db.collection(SOURCES_COLLECTION).doc(sourceId).get();
  const source = docToSource(sourceDoc);
  if (!source || source.ownerId !== ownerId) {
    return false;
  }

  await db
    .collection(SOURCE_UPLOADS_COLLECTION)
    .doc(sourceId)
    .set({ ownerId, projectId: source.projectId, ...payload, createdAt: new Date().toISOString() });

  await db
    .collection(SOURCES_COLLECTION)
    .doc(sourceId)
    .set({ status: 'PROCESSING', updatedAt: new Date().toISOString() }, { merge: true });

  return true;
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

  const extractionStart = Date.now();
  const extractedText = await extractText(payload);
  const chunks = chunkText(extractedText.text, 800);

  // Generate embeddings with batch processing and retry logic
  let embeddings: number[][];
  let embeddingLatency = 0;
  let embeddingUsage: any;
  let cached = false;

  try {
    console.info(`[ingestion] Generating embeddings for ${chunks.length} chunks`);
    
    // Process embeddings in batches of 50 to avoid rate limits
    const BATCH_SIZE = 50;
    const allEmbeddings: number[][] = [];
    let totalLatency = 0;
    let totalUsage: any = {};

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      const batchTexts = batchChunks.map(chunk => chunk.text);
      
      console.info(`[ingestion] Processing embedding batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(chunks.length/BATCH_SIZE)}`);
      
      const batchResult = await createEmbeddings(batchTexts);
      allEmbeddings.push(...batchResult.embeddings);
      totalLatency += batchResult.latencyMs;
      cached = batchResult.cached;
      
      if (batchResult.usage) {
        totalUsage.promptTokens = (totalUsage.promptTokens || 0) + (batchResult.usage.promptTokens || 0);
        totalUsage.totalTokens = (totalUsage.totalTokens || 0) + (batchResult.usage.totalTokens || 0);
      }
      
      // Small delay between batches to be respectful to the API
      if (i + BATCH_SIZE < chunks.length && !cached) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    embeddings = allEmbeddings;
    embeddingLatency = totalLatency;
    embeddingUsage = totalUsage;

    if (embeddingUsage) {
      console.info(
        '[ingestion] embedding usage',
        JSON.stringify({ sourceId, ...embeddingUsage, cached, batches: Math.ceil(chunks.length/BATCH_SIZE) }, null, 2)
      );
    }
  } catch (error) {
    console.error(`[ingestion] Embedding generation failed for ${sourceId}:`, error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (embeddings.length !== chunks.length) {
    throw new Error(`Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`);
  }

  // Create a better summary using enhanced prompting
  const summaryText = extractedText.text.slice(0, 8000); // Increased context
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
    // Clean the response to extract just the JSON
    let responseText = summaryResponse.output.trim();
    
    // Remove any markdown code blocks
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to find JSON in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    const parsed = SourceSummarySchema.parse(JSON.parse(responseText));
    summary = parsed;
  } catch (error) {
    console.warn(`[ingestion] Failed to parse summary for ${sourceId}:`, error);
    // Fallback to a basic summary
    summary = {
      abstract: summaryText.slice(0, 300) + '...',
      bulletPoints: [
        'Failed to generate structured summary',
        `Source contains approximately ${wordCount} words`,
        'Manual review recommended for key insights'
      ]
    };
  }

  const sourceChunks: SourceChunk[] = chunks.map((chunk, index) => ({
    id: randomUUID(),
    sourceId,
    projectId: source.projectId,
    order: index,
    text: chunk.text,
    tokenCount: chunk.approxTokenCount,
    embedding: embeddings[index],
    metadata: {
      heading: chunk.heading ?? undefined,
      pageRange: chunk.pageRange ?? undefined
    }
  }));

  // Clean up existing chunks
  console.info(`[ingestion] Cleaning up existing chunks for ${sourceId}`);
  await deleteExistingChunks(sourceId);

  // Store chunks in batches (Firestore has 500 operation limit per batch)
  console.info(`[ingestion] Storing ${sourceChunks.length} chunks for ${sourceId}`);
  const FIRESTORE_BATCH_SIZE = 400; // Leave room for other operations
  
  try {
    for (let i = 0; i < sourceChunks.length; i += FIRESTORE_BATCH_SIZE) {
      const batchChunks = sourceChunks.slice(i, i + FIRESTORE_BATCH_SIZE);
      const batch = db.batch();
      
      batchChunks.forEach((chunk) => {
        const ref = db.collection(SOURCE_CHUNKS_COLLECTION).doc(chunk.id);
        batch.set(ref, chunk);
      });
      
      await batch.commit();
      console.info(`[ingestion] Stored chunk batch ${Math.floor(i/FIRESTORE_BATCH_SIZE) + 1}/${Math.ceil(sourceChunks.length/FIRESTORE_BATCH_SIZE)}`);
    }

    // Update source document and cleanup
    const finalBatch = db.batch();
    finalBatch.set(
      sourceDocRef,
      {
        status: 'READY',
        summary,
        embeddingModel: cached ? 'mock-embedding' : 'openai/text-embedding-3-small',
        chunkCount: sourceChunks.length,
        totalTokens: sourceChunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0),
        updatedAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      },
      { merge: true }
    );

    finalBatch.delete(db.collection(SOURCE_UPLOADS_COLLECTION).doc(sourceId));
    await finalBatch.commit();

    console.info(`[ingestion] Successfully processed source ${sourceId} with ${sourceChunks.length} chunks`);
  } catch (error) {
    console.error(`[ingestion] Failed to store chunks for ${sourceId}:`, error);
    // Mark source as failed
    await sourceDocRef.set({ 
      status: 'FAILED', 
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown storage error'
    }, { merge: true });
    throw error;
  }

  const processingTime = Date.now() - extractionStart;
  
  return {
    sourceId,
    status: 'READY',
    summary,
    embeddingModel: cached ? 'mock-embedding' : 'openai/text-embedding-3-small',
    chunkCount: sourceChunks.length,
    processingTimeMs: processingTime
  };
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
    let contentType: 'TEXT' | 'PDF';

    if (file.mimetype === 'application/pdf') {
      const pdfModule = (await import('pdf-parse')) as unknown as {
        default?: (data: Buffer) => Promise<{ text: string }>
      };
      const pdfParseFn =
        pdfModule.default ??
        ((pdfModule as unknown) as (data: Buffer) => Promise<{ text: string }>);
      const pdf = await pdfParseFn(fileBuffer);
      extractedText = { text: pdf.text, wordCount: pdf.text.split(/\s+/).length };
      contentType = 'PDF';
    } else {
      // Treat as text file
      const text = fileBuffer.toString('utf-8');
      extractedText = { text, wordCount: text.split(/\s+/).length };
      contentType = 'TEXT';
    }

    // Store the upload payload
    const uploadPayload: SourceUploadInput = {
      contentType,
      data: fileBuffer.toString('base64')
    };

    await db
      .collection(SOURCE_UPLOADS_COLLECTION)
      .doc(sourceId)
      .set({ 
        ownerId, 
        projectId: source.projectId, 
        ...uploadPayload, 
        originalFilename: file.originalFilename,
        createdAt: new Date().toISOString() 
      });

    // Update source status
    await db
      .collection(SOURCES_COLLECTION)
      .doc(sourceId)
      .set({ status: 'UPLOADED', updatedAt: new Date().toISOString() }, { merge: true });

    // Automatically trigger ingestion
    return await ingestSource(ownerId, sourceId);
  } catch (error) {
    // Update source status to indicate failure
    await db
      .collection(SOURCES_COLLECTION)
      .doc(sourceId)
      .set({ status: 'FAILED', updatedAt: new Date().toISOString() }, { merge: true });
    
    throw error;
  }
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
  const pdfModule = (await import('pdf-parse')) as unknown as {
    default?: (data: Buffer) => Promise<{ text: string }>
  };
  const pdfParseFn =
    pdfModule.default ??
    ((pdfModule as unknown) as (data: Buffer) => Promise<{ text: string }>);
  const pdf = await pdfParseFn(buffer);
  return { text: pdf.text, wordCount: pdf.text.split(/\s+/).length };
}
