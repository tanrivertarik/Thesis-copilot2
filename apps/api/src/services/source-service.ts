import { randomUUID } from 'crypto';
import type {
  Source,
  SourceCreateInput,
  SourceIngestionResult,
  SourceChunk,
  SourceUploadInput
} from '@thesis-copilot/shared';
import { SourceStatusSchema } from '@thesis-copilot/shared';
import { createEmbeddings, generateChatCompletion } from '../ai/openrouter.js';
import { chunkText } from './text-utils.js';

type ChunkStoreKey = string; // projectId

const sources = new Map<string, Source>();
const chunksByProject = new Map<ChunkStoreKey, SourceChunk[]>();
const sourcePayloads = new Map<string, SourceUploadInput>();

export async function listSources(ownerId: string, projectId: string): Promise<Source[]> {
  return Array.from(sources.values()).filter(
    (source) => source.projectId === projectId && source.ownerId === ownerId
  );
}

export async function createSource(
  ownerId: string,
  input: SourceCreateInput
): Promise<Source> {
  const now = new Date().toISOString();
  const source: Source = {
    id: randomUUID(),
    ownerId,
    projectId: input.projectId,
    kind: input.kind,
    status: input.upload ? 'PROCESSING' : 'UPLOADED',
    metadata: input.metadata,
    createdAt: now,
    updatedAt: now
  };

  sources.set(source.id, source);
  if (input.upload) {
    sourcePayloads.set(source.id, input.upload);
  }
  return source;
}

export async function ingestSource(
  ownerId: string,
  sourceId: string
): Promise<SourceIngestionResult | null> {
  const source = sources.get(sourceId);
  if (!source || source.ownerId !== ownerId) {
    return null;
  }

  const payload = sourcePayloads.get(sourceId);
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

  const updatedSource: Source = {
    ...source,
    status: 'READY',
    updatedAt: new Date().toISOString()
  };

  // Extract text
  const extractionStart = Date.now();
  const extractedText = await extractText(payload);
  const chunks = chunkText(extractedText.text, 800);

  // Generate embeddings
  const { embeddings, latencyMs: embeddingLatency, usage: embeddingUsage, cached } =
    await createEmbeddings(chunks.map((chunk) => chunk.text));
  if (embeddingUsage) {
    console.info(
      '[ingestion] embedding usage',
      JSON.stringify({ sourceId, ...embeddingUsage, cached }, null, 2)
    );
  }

  // Summarize
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

  const summaryOutput = summaryResponse.output;
  let summary = updatedSource.summary;
  try {
    summary = JSON.parse(summaryOutput);
  } catch (error) {
    summary = {
      abstract: summaryOutput,
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

  const existingChunks = chunksByProject.get(source.projectId) ?? [];
  chunksByProject.set(source.projectId, [...existingChunks, ...sourceChunks]);

  sourcePayloads.delete(sourceId);

  updatedSource.summary = summary;
  updatedSource.embeddingModel = cached ? 'mock-embedding' : 'openai/text-embedding-3-small';
  sources.set(sourceId, updatedSource);

  return {
    sourceId,
    status: updatedSource.status,
    summary: updatedSource.summary,
    embeddingModel: updatedSource.embeddingModel,
    chunkCount: sourceChunks.length,
    processingTimeMs:
      Date.now() - extractionStart + embeddingLatency + summaryResponse.latencyMs
  };
}

export async function getChunksForProject(projectId: string): Promise<SourceChunk[]> {
  return chunksByProject.get(projectId) ?? [];
}

export async function updateSourceStatus(
  sourceId: string,
  status: string
): Promise<void> {
  const parsed = SourceStatusSchema.safeParse(status);
  if (!parsed.success) {
    throw new Error(`Invalid source status supplied: ${status}`);
  }
  const source = sources.get(sourceId);
  if (!source) {
    return;
  }
  sources.set(sourceId, { ...source, status: parsed.data, updatedAt: new Date().toISOString() });
}

export async function uploadSourceContent(
  ownerId: string,
  sourceId: string,
  payload: SourceUploadInput
): Promise<boolean> {
  const source = sources.get(sourceId);
  if (!source || source.ownerId !== ownerId) {
    return false;
  }
  sourcePayloads.set(sourceId, payload);
  sources.set(sourceId, {
    ...source,
    status: 'PROCESSING',
    updatedAt: new Date().toISOString()
  });
  return true;
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
    default?: (data: Buffer) => Promise<{ text: string }>;
  };
  const pdfParseFn =
    pdfModule.default ??
    ((pdfModule as unknown) as (data: Buffer) => Promise<{ text: string }>);
  const pdf = await pdfParseFn(buffer);
  return { text: pdf.text, wordCount: pdf.text.split(/\s+/).length };
}
