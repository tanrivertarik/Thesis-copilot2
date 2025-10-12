import { performance } from 'node:perf_hooks';
import { env } from '../config/env.js';

type EmbeddingResponse = {
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
const DEFAULT_REFERER = 'https://thesis-copilot.local';
const DEFAULT_TITLE = 'Thesis Copilot';

function hasOpenRouterKey() {
  return Boolean(env.openRouterApiKey);
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
  inputs: string[],
  model = 'openai/text-embedding-3-small'
): Promise<EmbeddingResponse> {
  const start = performance.now();

  if (!hasOpenRouterKey()) {
    const embeddings = inputs.map((input, index) => randomEmbedding(256, index + input.length));
    return {
      embeddings,
      latencyMs: performance.now() - start,
      cached: true
    };
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      input: inputs
    })
  });

  const latencyMs = performance.now() - start;
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter embeddings failed: ${response.status} - ${errorText}`);
  }

  const json = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
    usage?: { prompt_tokens?: number; total_tokens?: number };
  };

  const embeddings = json.data.map((item) => item.embedding);

  return {
    embeddings,
    latencyMs,
    usage: {
      promptTokens: json.usage?.prompt_tokens,
      totalTokens: json.usage?.total_tokens
    },
    cached: false
  };
}

export async function generateChatCompletion({
  model = 'anthropic/claude-3.5-sonnet',
  systemPrompt,
  userPrompt,
  maxTokens = 800,
  temperature = 0.3
}: {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<ChatResponse> {
  const start = performance.now();

  if (!hasOpenRouterKey()) {
    return {
      output: `${userPrompt}\n\n[OpenRouter API key missing — returning prompt echo for local testing.]`,
      latencyMs: performance.now() - start,
      cached: true
    };
  }

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
    throw new Error(`OpenRouter chat failed: ${response.status} - ${errorText}`);
  }

  const json = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  const content = json.choices.at(0)?.message?.content ?? '';

  return {
    output: content,
    latencyMs,
    usage: {
      promptTokens: json.usage?.prompt_tokens,
      completionTokens: json.usage?.completion_tokens,
      totalTokens: json.usage?.total_tokens
    },
    cached: false
  };
}
