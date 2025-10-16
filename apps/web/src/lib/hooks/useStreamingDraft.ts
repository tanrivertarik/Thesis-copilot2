import { useState, useCallback } from 'react';
import type { SectionDraftRequest } from '@thesis-copilot/shared';
import { env } from '../env';
import { getIdToken } from '../auth-token';

type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

type UseStreamingDraftOptions = {
  onToken?: (content: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
};

export function useStreamingDraft({ onToken, onComplete, onError }: UseStreamingDraftOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateDraftStreaming = useCallback(
    async (request: SectionDraftRequest) => {
      setIsGenerating(true);
      setGeneratedText('');
      setError(null);

      let accumulatedText = '';

      try {
        const token = await getIdToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`${env.apiBaseUrl}/api/drafting/section/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          throw new Error(`API ${response.status}: ${await response.text()}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // Process SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              try {
                const event = JSON.parse(data) as StreamEvent;

                if (event.type === 'token') {
                  accumulatedText += event.content;
                  setGeneratedText(accumulatedText);
                  onToken?.(event.content);
                } else if (event.type === 'error') {
                  setError(event.message);
                  onError?.(event.message);
                } else if (event.type === 'done') {
                  onComplete?.(accumulatedText);
                }
              } catch (err) {
                console.error('Failed to parse SSE event:', err);
              }
            }
          }
        }
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        onError?.(message);
      } finally {
        setIsGenerating(false);
      }
    },
    [onToken, onComplete, onError]
  );

  return {
    generateDraftStreaming,
    isGenerating,
    generatedText,
    error
  };
}
