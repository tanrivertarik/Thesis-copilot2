import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type { Draft, DraftCitation } from '@thesis-copilot/shared';
import { fetchDraft, saveDraft } from '../../../lib/api';

const AUTOSAVE_DELAY_MS = 2000;

type DraftContextValue = {
  projectId: string | null;
  sectionId: string | null;
  html: string;
  citations: DraftCitation[];
  annotations: Draft['annotations'];
  version: number;
  updatedAt: string | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  error: string | null;
  lastSavedAt: string | null;
  persistedHtml: string;
  setHtml: (value: string) => void;
  setCitations: (value: DraftCitation[] | ((prev: DraftCitation[]) => DraftCitation[])) => void;
  manualSave: () => Promise<void>;
  reload: () => Promise<void>;
};

const DraftContext = createContext<DraftContextValue | undefined>(undefined);

const FALLBACK_HTML = '<p></p>';

type DraftProviderProps = {
  projectId: string | null;
  sectionId: string | null;
  children: React.ReactNode;
};

type SnapshotPayload = {
  html: string;
  citations: DraftCitation[];
  annotations: Draft['annotations'];
};

function toSnapshot(payload: SnapshotPayload) {
  return JSON.stringify(payload);
}

export function DraftProvider({ projectId, sectionId, children }: DraftProviderProps) {
  const [html, setHtmlState] = useState('');
  const [citations, setCitationsState] = useState<DraftCitation[]>([]);
  const [annotations, setAnnotationsState] = useState<Draft['annotations']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [version, setVersion] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autosaveReady, setAutosaveReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [persistedHtml, setPersistedHtml] = useState('');

  const savedSnapshotRef = useRef<string | null>(null);
  const pendingSnapshotRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const htmlRef = useRef('');
  const citationsRef = useRef<DraftCitation[]>([]);
  const annotationsRef = useRef<Draft['annotations']>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    htmlRef.current = html;
  }, [html]);

  useEffect(() => {
    citationsRef.current = citations;
  }, [citations]);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const clearPendingSave = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const commitSave = useCallback(
    async (reason: 'manual' | 'autosave') => {
      if (!projectId || !sectionId) {
        return;
      }

      if (reason === 'autosave' && !hasUnsavedChanges) {
        return;
      }

      clearPendingSave();
      setIsSaving(true);
      setError(null);

      const payload: SnapshotPayload = {
        html: htmlRef.current,
        citations: citationsRef.current,
        annotations: annotationsRef.current
      };

      try {
        const draft = await saveDraft(projectId, sectionId, {
          ...payload
        });

        if (!mountedRef.current) {
          return;
        }

        const snapshot = toSnapshot(payload);
        savedSnapshotRef.current = snapshot;
        pendingSnapshotRef.current = snapshot;
        setHasUnsavedChanges(false);
        setVersion(draft.version);
        setUpdatedAt(draft.updatedAt);
        setLastSavedAt(draft.updatedAt);
        setPersistedHtml(payload.html);
      } catch (err) {
        if (!mountedRef.current) {
          return;
        }
        const message = (err as Error).message;
        setError(message);
        setHasUnsavedChanges(true);
      } finally {
        if (mountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    [clearPendingSave, hasUnsavedChanges, projectId, sectionId]
  );

  const scheduleIfDirty = useCallback(
    (next: SnapshotPayload) => {
      const snapshot = toSnapshot(next);
      pendingSnapshotRef.current = snapshot;

      if (savedSnapshotRef.current === snapshot) {
        setHasUnsavedChanges(false);
        clearPendingSave();
        return;
      }

      setHasUnsavedChanges(true);

      if (!autosaveReady) {
        return;
      }

      clearPendingSave();
      timerRef.current = window.setTimeout(() => {
        void commitSave('autosave');
      }, AUTOSAVE_DELAY_MS);
    },
    [autosaveReady, clearPendingSave, commitSave]
  );

  useEffect(() => {
    setAutosaveReady(false);
    clearPendingSave();
    savedSnapshotRef.current = null;
    pendingSnapshotRef.current = null;
    setHasUnsavedChanges(false);
    setVersion(1);
    setUpdatedAt(null);
    setLastSavedAt(null);
    setError(null);

    if (!projectId || !sectionId) {
      setHtmlState('');
      setCitationsState([]);
      setAnnotationsState([]);
      setIsLoading(false); // Don't show loading when no project/section
      return;
    }

    let cancelled = false;

    const loadDraft = async () => {
      setIsLoading(true);
      console.log('[EditorContext] Loading draft:', { projectId, sectionId });

      // Set a timeout to show error if loading takes too long
      const timeoutId = setTimeout(() => {
        if (!cancelled && mountedRef.current) {
          console.error('[EditorContext] Loading timeout - backend might not be running');
          setError('Loading timeout. Please check that your backend API is running on port 3001.');
          setIsLoading(false);
        }
      }, 10000); // 10 second timeout

      try {
        const draft = await fetchDraft(projectId, sectionId);
        clearTimeout(timeoutId); // Clear timeout on success
        console.log('[EditorContext] Draft fetched:', draft);
        
        if (cancelled || !mountedRef.current) {
          return;
        }

        const initialHtml = draft?.html ?? FALLBACK_HTML;
        const initialCitations = draft?.citations ?? [];
        const initialAnnotations = draft?.annotations ?? [];

        console.log('[EditorContext] Setting states with:', {
          initialHtml,
          htmlLength: initialHtml.length,
          draftExists: !!draft
        });

        setHtmlState(initialHtml);
        setCitationsState(initialCitations);
        setAnnotationsState(initialAnnotations);
        setVersion(draft?.version ?? 1);
        setUpdatedAt(draft?.updatedAt ?? null);
        setLastSavedAt(draft?.updatedAt ?? null);
        setPersistedHtml(initialHtml);

        htmlRef.current = initialHtml;
        citationsRef.current = initialCitations;
        annotationsRef.current = initialAnnotations;

        const snapshot = toSnapshot({
          html: initialHtml,
          citations: initialCitations,
          annotations: initialAnnotations
        });
        savedSnapshotRef.current = snapshot;
        pendingSnapshotRef.current = snapshot;
        setHasUnsavedChanges(false);
      } catch (err) {
        clearTimeout(timeoutId); // Clear timeout on error
        console.error('[EditorContext] Error loading draft:', err);
        if (!cancelled && mountedRef.current) {
          const errorMessage = (err as Error).message;
          // Improve error messages for common issues
          if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            setError('Cannot connect to backend. Please ensure the API server is running on port 3001.');
          } else {
            setError(errorMessage);
          }
        }
      } finally {
        console.log('[EditorContext] Finally block executing', {
          cancelled,
          mountedRef: mountedRef.current
        });
        // Always set isLoading to false, even if unmounting
        // This ensures the state is correct if component remounts
        if (!cancelled) {
          console.log('[EditorContext] Setting isLoading to false');
          setIsLoading(false);
          setAutosaveReady(true);
          console.log('[EditorContext] Called setIsLoading(false)');
        } else {
          console.log('[EditorContext] Skipped because cancelled=true');
        }
      }
    };

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [projectId, sectionId, reloadKey, clearPendingSave]);

  const setHtml = useCallback(
    (value: string) => {
      setHtmlState(value);
      htmlRef.current = value;
      scheduleIfDirty({
        html: value,
        citations: citationsRef.current,
        annotations: annotationsRef.current
      });
    },
    [scheduleIfDirty]
  );

  const updateCitations = useCallback(
    (value: DraftCitation[] | ((prev: DraftCitation[]) => DraftCitation[])) => {
      setCitationsState((prev) => {
        const next =
          typeof value === 'function'
            ? (value as (prev: DraftCitation[]) => DraftCitation[])(prev)
            : value;
        citationsRef.current = next;
        scheduleIfDirty({
          html: htmlRef.current,
          citations: next,
          annotations: annotationsRef.current
        });
        return next;
      });
    },
    [scheduleIfDirty]
  );

  const manualSave = useCallback(async () => {
    await commitSave('manual');
  }, [commitSave]);

  const reload = useCallback(async () => {
    setReloadKey((key) => key + 1);
  }, []);

  const value = useMemo<DraftContextValue>(
    () => ({
      projectId,
      sectionId,
      html,
      citations,
      annotations,
      version,
      updatedAt,
      isLoading,
      isSaving,
      hasUnsavedChanges,
      error,
      lastSavedAt,
      persistedHtml,
      setHtml,
      setCitations: updateCitations,
      manualSave,
      reload
    }),
    [
      projectId,
      sectionId,
      html,
      citations,
      annotations,
      version,
      updatedAt,
      isLoading,
      isSaving,
      hasUnsavedChanges,
      error,
      lastSavedAt,
      persistedHtml,
      setHtml,
      updateCitations,
      manualSave,
      reload
    ]
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDraft must be used within DraftProvider');
  }
  return context;
}
