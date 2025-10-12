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

  const { embeddings, latencyMs: embeddingLatency, usage: embeddingUsage, cached } =
    await createEmbeddings(chunks.map((chunk) => chunk.text));
  if (embeddingUsage) {
    console.info(
      '[ingestion] embedding usage',
      JSON.stringify({ sourceId, ...embeddingUsage, cached }, null, 2)
    );
  }

  const summaryResponse = await generateChatCompletion({
    model: 'openai/gpt-4o-mini',
    systemPrompt:
      'You are an academic assistant. Summarize the provided source text. Return JSON with "abstract" and "bulletPoints" (array).',
    userPrompt: `Source Title: ${source.metadata.title}\n\nContent:\n${extractedText.text.slice(
      0,
      6000
    )}\n\nReturn JSON only.`,
    maxTokens: 400,
    temperature: 0.2
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
    const parsed = SourceSummarySchema.parse(JSON.parse(summaryResponse.output));
    summary = parsed;
  } catch (error) {
    summary = {
      abstract: summaryResponse.output,
      bulletPoints: [`Failed to parse JSON summary: ${(error as Error).message}`]
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

  await deleteExistingChunks(sourceId);

  const batch = db.batch();
  sourceChunks.forEach((chunk) => {
    const ref = db.collection(SOURCE_CHUNKS_COLLECTION).doc(chunk.id);
    batch.set(ref, chunk);
  });

  batch.set(
    sourceDocRef,
    {
      status: 'READY',
      summary,
      embeddingModel: cached ? 'mock-embedding' : 'openai/text-embedding-3-small',
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  batch.delete(db.collection(SOURCE_UPLOADS_COLLECTION).doc(sourceId));
  await batch.commit();

  return {
    sourceId,
    status: 'READY',
    summary,
    embeddingModel: cached ? 'mock-embedding' : 'openai/text-embedding-3-small',
    chunkCount: sourceChunks.length,
    processingTimeMs:
      Date.now() - extractionStart + embeddingLatency + summaryResponse.latencyMs
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
