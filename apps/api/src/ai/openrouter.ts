import { performance } from 'node:perf_hooks';
import { env } from '../config/env.js';
import { 
  AIServiceError, 
  ErrorCode, 
  ErrorFactory, 
  withRetry,
  type ErrorContext 
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

type EmbeddingResponse = {
  model?: string;
  embeddings: number[][];
  latencyMs: number;
  usage?: {
    promptTokens?: number;
    totalTokens?: number;
  };
  cached: boolean;
};

type ChatResponse = {
  output: string;
  latencyMs: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  cached: boolean;
};

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
function pineconeBaseUrl() {
  if (env.pineconeHost) {
    return env.pineconeHost.replace(/\/$/, '');
  }
  return 'https://api.pinecone.io';
}
const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';
const DEFAULT_REFERER = 'https://thesis-copilot.local';
const DEFAULT_TITLE = 'Thesis Copilot';

function hasOpenRouterKey() {
  return Boolean(env.openRouterApiKey);
}

function hasOpenAiKey() {
  return Boolean(env.openAiApiKey);
}

function hasPineconeKey() {
  return Boolean(env.pineconeApiKey);
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (env.openRouterApiKey) {
    headers.Authorization = `Bearer ${env.openRouterApiKey}`;
    headers['HTTP-Referer'] = DEFAULT_REFERER;
    headers['X-Title'] = DEFAULT_TITLE;
  }
  return headers;
}

function randomEmbedding(dim = 256, seed = Math.random() * 1000) {
  const values: number[] = [];
  let localSeed = seed;
  for (let i = 0; i < dim; i += 1) {
    localSeed = Math.sin(localSeed) * 10000;
    values.push(localSeed - Math.floor(localSeed));
  }
  return values;
}

export async function createEmbeddings(
  texts: string[],
  context: ErrorContext = {}
): Promise<EmbeddingResponse> {
  const operation = async (): Promise<EmbeddingResponse> => {
    const start = performance.now();

    if (!hasOpenAiKey() && !hasPineconeKey() && !hasOpenRouterKey()) {
      logger.warn('No embedding provider configured, returning mock embeddings', context);
      return {
        model: 'mock-embedding',
        embeddings: texts.map(() => Array(768).fill(0.5)),
        latencyMs: performance.now() - start,
        cached: false
      };
    }

    try {
      if (hasOpenAiKey()) {
        logger.debug(`Creating embeddings via OpenAI for ${texts.length} texts`, context, {
          textLengths: texts.map((t) => t.length),
          totalCharacters: texts.reduce((sum, t) => sum + t.length, 0)
        });

        const response = await fetch(OPENAI_EMBEDDINGS_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.openAiApiKey as string}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: env.openAiEmbeddingModel ?? 'text-embedding-3-small',
            input: texts
          })
        });

        const latencyMs = performance.now() - start;

        if (!response.ok) {
          const errorText = await response.text();
          logger.error(`OpenAI embeddings API failed: ${response.status}`, undefined, {
            ...context,
            statusCode: response.status,
            errorText: errorText.substring(0, 500)
          });

          const errorCode =
            response.status === 429
              ? ErrorCode.AI_QUOTA_EXCEEDED
              : response.status === 401
              ? ErrorCode.AI_SERVICE_ERROR
              : response.status >= 500
              ? ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE
              : ErrorCode.EMBEDDING_GENERATION_FAILED;

          throw new AIServiceError(
            errorCode,
            `OpenAI embedding request failed: ${response.status} - ${errorText}`,
            { ...context, statusCode: response.status }
          );
        }

        const json = (await response.json()) as {
          data: Array<{ embedding: number[] }>;
          model?: string;
          usage?: { prompt_tokens?: number; total_tokens?: number };
        };

        const model = json.model ?? env.openAiEmbeddingModel ?? 'text-embedding-3-small';

        const result = {
          model,
          embeddings: json.data.map((item) => item.embedding),
          latencyMs,
          usage: {
            promptTokens: json.usage?.prompt_tokens,
            totalTokens: json.usage?.total_tokens
          },
          cached: false
        };

        logger.info(`Successfully created ${result.embeddings.length} OpenAI embeddings`, context, {
          latencyMs: result.latencyMs,
          usage: result.usage,
          dimensionality: result.embeddings[0]?.length,
          model
        });

        return result;
      }

      if (hasPineconeKey()) {
        logger.debug(`Creating embeddings via Pinecone for ${texts.length} texts`, context, {
          textLengths: texts.map((t) => t.length),
          totalCharacters: texts.reduce((sum, t) => sum + t.length, 0)
        });

        const response = await fetch(`${pineconeBaseUrl()}/inference/v1/embeddings`, {
          method: 'POST',
          headers: {
            'Api-Key': env.pineconeApiKey as string,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: env.pineconeEmbeddingModel ?? 'text-embedding-3-large',
            input: texts
          })
        });

        const latencyMs = performance.now() - start;

        if (!response.ok) {
          const errorText = await response.text();
          logger.error(`Pinecone embeddings API failed: ${response.status}`, undefined, {
            ...context,
            statusCode: response.status,
            errorText: errorText.substring(0, 500)
          });

          const errorCode =
            response.status === 429
              ? ErrorCode.AI_QUOTA_EXCEEDED
              : response.status === 401
              ? ErrorCode.AI_SERVICE_ERROR
              : response.status >= 500
              ? ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE
              : ErrorCode.EMBEDDING_GENERATION_FAILED;

          throw new AIServiceError(
            errorCode,
            `Pinecone embedding request failed: ${response.status} - ${errorText}`,
            { ...context, statusCode: response.status }
          );
        }

        const json = (await response.json()) as {
          data: Array<{ embedding: number[] }>;
          model?: string;
          usage?: { input_tokens?: number; total_tokens?: number };
        };

        const model = json.model ?? env.pineconeEmbeddingModel ?? 'text-embedding-3-large';

        const result = {
          model,
          embeddings: json.data.map((item) => item.embedding),
          latencyMs,
          usage: {
            promptTokens: json.usage?.input_tokens,
            totalTokens: json.usage?.total_tokens
          },
          cached: false
        };

        logger.info(`Successfully created ${result.embeddings.length} pinecone embeddings`, context, {
          latencyMs: result.latencyMs,
          usage: result.usage,
          dimensionality: result.embeddings[0]?.length,
          model
        });

        return result;
      }

      logger.debug(`Creating embeddings via OpenRouter for ${texts.length} texts`, context, {
        textLengths: texts.map((t) => t.length),
        totalCharacters: texts.reduce((sum, t) => sum + t.length, 0)
      });

      const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.openRouterApiKey as string}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://thesis-copilot.com',
          'X-Title': 'Thesis Copilot'
        },
        body: JSON.stringify({
          model: 'openai/text-embedding-3-small',
          input: texts
        })
      });

      const latencyMs = performance.now() - start;

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`OpenRouter embeddings API failed: ${response.status}`, undefined, {
          ...context,
          statusCode: response.status,
          errorText: errorText.substring(0, 500)
        });

        // Handle specific error codes
        if (response.status === 429) {
          throw new AIServiceError(
            ErrorCode.AI_QUOTA_EXCEEDED,
            `Embedding generation rate limit exceeded: ${errorText}`,
            { ...context, statusCode: response.status }
          );
        } else if (response.status === 401) {
          throw new AIServiceError(
            ErrorCode.AI_SERVICE_ERROR,
            `OpenRouter authentication failed: ${errorText}`,
            { ...context, statusCode: response.status }
          );
        } else if (response.status >= 500) {
          throw new AIServiceError(
            ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
            `OpenRouter service unavailable: ${response.status} - ${errorText}`,
            { ...context, statusCode: response.status }
          );
        } else {
          throw new AIServiceError(
            ErrorCode.EMBEDDING_GENERATION_FAILED,
            `Embedding generation failed: ${response.status} - ${errorText}`,
            { ...context, statusCode: response.status }
          );
        }
      }

      const json = (await response.json()) as {
        data: Array<{ embedding: number[] }>;
        usage?: { prompt_tokens?: number; total_tokens?: number };
      };

      const result = {
        model: 'openai/text-embedding-3-small',
        embeddings: json.data.map((item) => item.embedding),
        latencyMs,
        usage: {
          promptTokens: json.usage?.prompt_tokens,
          totalTokens: json.usage?.total_tokens
        },
        cached: false
      };

      logger.info(`Successfully created ${result.embeddings.length} embeddings`, context, {
        latencyMs: result.latencyMs,
        usage: result.usage,
        dimensionality: result.embeddings[0]?.length
      });

      return result;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      const latencyMs = performance.now() - start;
      logger.error(`Embedding generation failed after ${latencyMs}ms`, error as Error, context);

      throw ErrorFactory.createFromCode(
        ErrorCode.EMBEDDING_GENERATION_FAILED,
        `Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`,
        { ...context, latencyMs },
        error instanceof Error ? error : undefined
      );
    }
  };

  return withRetry(operation, {
    maxRetries: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
    retryableErrors: [
      ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      ErrorCode.AI_SERVICE_ERROR,
      ErrorCode.CONNECTION_TIMEOUT
    ]
  }, context);
}

export async function generateChatCompletion({
  model = 'google/gemini-2.5-pro',
  systemPrompt,
  userPrompt,
  maxTokens = 100000,
  temperature = 0.7
}: {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}, context: ErrorContext = {}): Promise<ChatResponse> {
  const operation = async (): Promise<ChatResponse> => {
    const start = performance.now();

    if (!hasOpenRouterKey()) {
      logger.warn('OpenRouter API key missing, returning mock response', context);
      return {
        output: `${userPrompt}\n\n[OpenRouter API key missing — returning prompt echo for local testing.]`,
        latencyMs: performance.now() - start,
        cached: false
      };
    }

    logger.debug(`Generating chat completion with model ${model}`, context, {
      model,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      maxTokens,
      temperature
    });

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      const latencyMs = performance.now() - start;

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`OpenRouter chat completion API failed: ${response.status}`, undefined, {
          ...context,
          statusCode: response.status,
          model,
          errorText: errorText.substring(0, 500)
        });

        // Handle specific error codes
        if (response.status === 429) {
          throw new AIServiceError(
            ErrorCode.AI_QUOTA_EXCEEDED,
            `Chat completion rate limit exceeded: ${errorText}`,
            { ...context, statusCode: response.status, model }
          );
        } else if (response.status === 401) {
          throw new AIServiceError(
            ErrorCode.AI_SERVICE_ERROR,
            `OpenRouter authentication failed: ${errorText}`,
            { ...context, statusCode: response.status, model }
          );
        } else if (response.status === 400) {
          throw new AIServiceError(
            ErrorCode.CONTENT_GENERATION_FAILED,
            `Invalid request to OpenRouter: ${errorText}`,
            { ...context, statusCode: response.status, model }
          );
        } else if (response.status >= 500) {
          throw new AIServiceError(
            ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
            `OpenRouter service unavailable: ${response.status} - ${errorText}`,
            { ...context, statusCode: response.status, model }
          );
        } else {
          throw new AIServiceError(
            ErrorCode.CONTENT_GENERATION_FAILED,
            `Chat completion failed: ${response.status} - ${errorText}`,
            { ...context, statusCode: response.status, model }
          );
        }
      }

      const json = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const content = json.choices.at(0)?.message?.content ?? '';

      if (!content) {
        logger.warn('Empty response from OpenRouter chat completion', context, { model, latencyMs });
        throw new AIServiceError(
          ErrorCode.CONTENT_GENERATION_FAILED,
          'Received empty response from AI service',
          { ...context, model, latencyMs }
        );
      }

      const result = {
        output: content,
        latencyMs,
        usage: {
          promptTokens: json.usage?.prompt_tokens,
          completionTokens: json.usage?.completion_tokens,
          totalTokens: json.usage?.total_tokens
        },
        cached: false
      };

      logger.info(`Successfully generated chat completion`, context, {
        model,
        latencyMs: result.latencyMs,
        outputLength: content.length,
        usage: result.usage
      });

      return result;

    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      const latencyMs = performance.now() - start;
      logger.error(`Chat completion failed after ${latencyMs}ms`, error as Error, { ...context, model });

      throw ErrorFactory.createFromCode(
        ErrorCode.CONTENT_GENERATION_FAILED,
        `Failed to generate chat completion: ${error instanceof Error ? error.message : String(error)}`,
        { ...context, model, latencyMs },
        error instanceof Error ? error : undefined
      );
    }
  };

  return withRetry(operation, {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 2,
    retryableErrors: [
      ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      ErrorCode.AI_SERVICE_ERROR,
      ErrorCode.CONNECTION_TIMEOUT
    ]
  }, context);
}
