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
      console.log('[useStreamingDraft] Starting draft generation', {
        projectId: request.projectId,
        sectionId: request.sectionId
      });

      setIsGenerating(true);
      setGeneratedText('');
      setError(null);

      let accumulatedText = '';

      try {
        const token = await getIdToken();
        if (!token) {
          console.error('[useStreamingDraft] No authentication token available');
          throw new Error('Not authenticated');
        }

        console.log('[useStreamingDraft] Making fetch request to streaming endpoint');
        const response = await fetch(`${env.apiBaseUrl}/api/drafting/section/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useStreamingDraft] API request failed', {
            status: response.status,
            error: errorText
          });
          throw new Error(`API ${response.status}: ${errorText}`);
        }

        if (!response.body) {
          console.error('[useStreamingDraft] No response body from API');
          throw new Error('No response body');
        }

        console.log('[useStreamingDraft] Stream started, processing events...');
        // Process SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let tokenCount = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('[useStreamingDraft] Stream completed', { totalTokens: tokenCount });
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
                  tokenCount++;
                  accumulatedText += event.content;
                  setGeneratedText(accumulatedText);
                  onToken?.(event.content);
                } else if (event.type === 'error') {
                  console.error('[useStreamingDraft] Stream error event received', event.message);
                  setError(event.message);
                  onError?.(event.message);
                } else if (event.type === 'done') {
                  console.log('[useStreamingDraft] Stream done event received');
                  onComplete?.(accumulatedText);
                }
              } catch (err) {
                console.error('[useStreamingDraft] Failed to parse SSE event:', err);
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
