import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type { Draft, DraftCitation, ThesisSection } from '@thesis-copilot/shared';
import { fetchDraft, saveDraft, fetchProjects } from '../../../lib/api';

const AUTOSAVE_DELAY_MS = 2000;

type SectionDraft = {
  sectionId: string;
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
};

type MultiSectionContextValue = {
  projectId: string | null;
  sections: ThesisSection[];
  drafts: Map<string, SectionDraft>;
  activeSectionId: string | null;
  setActiveSectionId: (sectionId: string) => void;
  updateSectionHtml: (sectionId: string, html: string) => void;
  saveSectionDraft: (sectionId: string) => Promise<void>;
  saveAllDrafts: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isAnySaving: boolean;
  hasAnyUnsavedChanges: boolean;
};

const MultiSectionContext = createContext<MultiSectionContextValue | undefined>(undefined);

const FALLBACK_HTML = '<p></p>';

type MultiSectionProviderProps = {
  projectId: string | null;
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

export function MultiSectionProvider({ projectId, children }: MultiSectionProviderProps) {
  const [sections, setSections] = useState<ThesisSection[]>([]);
  const [drafts, setDrafts] = useState<Map<string, SectionDraft>>(new Map());
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savedSnapshotsRef = useRef<Map<string, string>>(new Map());
  const pendingSnapshotsRef = useRef<Map<string, string>>(new Map());
  const timersRef = useRef<Map<string, number>>(new Map());
  const mountedRef = useRef(true);

  // Load project and all sections
  useEffect(() => {
    if (!projectId) {
      setSections([]);
      setDrafts(new Map());
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadProjectSections = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch project to get sections
        const projects = await fetchProjects();
        const project = projects.find((p) => p.id === projectId);

        if (!project || !project.constitution) {
          throw new Error('Project or constitution not found');
        }

        if (cancelled) return;

        const projectSections = project.constitution.outline.sections;
        setSections(projectSections);

        // Set first section as active by default
        if (projectSections.length > 0 && !activeSectionId) {
          setActiveSectionId(projectSections[0].id);
        }

        // Load drafts for all sections in parallel
        const draftPromises = projectSections.map(async (section) => {
          const sectionDraft: SectionDraft = {
            sectionId: section.id,
            html: FALLBACK_HTML,
            citations: [],
            annotations: [],
            version: 1,
            updatedAt: null,
            isLoading: true,
            isSaving: false,
            error: null
          };

          try {
            const draft = await fetchDraft(projectId, section.id);
            if (draft) {
              sectionDraft.html = draft.html;
              sectionDraft.citations = draft.citations;
              sectionDraft.annotations = draft.annotations;
              sectionDraft.version = draft.version;
              sectionDraft.updatedAt = draft.updatedAt;
            }
          } catch (err) {
            sectionDraft.error = (err as Error).message;
          } finally {
            sectionDraft.isLoading = false;
          }

          return [section.id, sectionDraft] as [string, SectionDraft];
        });

        const loadedDrafts = await Promise.all(draftPromises);

        if (cancelled) return;

        const draftsMap = new Map(loadedDrafts);
        setDrafts(draftsMap);

        // Save initial snapshots for autosave tracking
        draftsMap.forEach((draft, sectionId) => {
          const snapshot = toSnapshot({
            html: draft.html,
            citations: draft.citations,
            annotations: draft.annotations
          });
          savedSnapshotsRef.current.set(sectionId, snapshot);
          pendingSnapshotsRef.current.set(sectionId, snapshot);
        });
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProjectSections();

    return () => {
      cancelled = true;
      // Clear all autosave timers
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current.clear();
    };
  }, [projectId, activeSectionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const scheduleAutosave = useCallback((sectionId: string, payload: SnapshotPayload) => {
    const snapshot = toSnapshot(payload);
    pendingSnapshotsRef.current.set(sectionId, snapshot);

    const savedSnapshot = savedSnapshotsRef.current.get(sectionId);
    const hasChanges = savedSnapshot !== snapshot;

    // Update hasUnsavedChanges flag
    setDrafts((prevDrafts) => {
      const newDrafts = new Map(prevDrafts);
      const draft = newDrafts.get(sectionId);
      if (draft) {
        newDrafts.set(sectionId, { ...draft, hasUnsavedChanges: hasChanges });
      }
      return newDrafts;
    });

    if (!hasChanges) {
      // Clear timer if no changes
      const timerId = timersRef.current.get(sectionId);
      if (timerId) {
        window.clearTimeout(timerId);
        timersRef.current.delete(sectionId);
      }
      return;
    }

    // Clear existing timer
    const existingTimer = timersRef.current.get(sectionId);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    // Schedule new autosave
    const timerId = window.setTimeout(() => {
      void saveSectionDraft(sectionId);
    }, AUTOSAVE_DELAY_MS);

    timersRef.current.set(sectionId, timerId);
  }, []);

  const updateSectionHtml = useCallback((sectionId: string, html: string) => {
    setDrafts((prevDrafts) => {
      const newDrafts = new Map(prevDrafts);
      const draft = newDrafts.get(sectionId);
      if (draft) {
        const updated = { ...draft, html };
        newDrafts.set(sectionId, updated);

        // Schedule autosave
        scheduleAutosave(sectionId, {
          html,
          citations: draft.citations,
          annotations: draft.annotations
        });
      }
      return newDrafts;
    });
  }, [scheduleAutosave]);

  const saveSectionDraft = useCallback(async (sectionId: string) => {
    if (!projectId) return;

    const draft = drafts.get(sectionId);
    if (!draft) return;

    // Clear autosave timer
    const timerId = timersRef.current.get(sectionId);
    if (timerId) {
      window.clearTimeout(timerId);
      timersRef.current.delete(sectionId);
    }

    // Mark as saving
    setDrafts((prevDrafts) => {
      const newDrafts = new Map(prevDrafts);
      newDrafts.set(sectionId, { ...draft, isSaving: true, error: null });
      return newDrafts;
    });

    try {
      const savedDraft = await saveDraft(projectId, sectionId, {
        html: draft.html,
        citations: draft.citations,
        annotations: draft.annotations
      });

      if (!mountedRef.current) return;

      // Update saved snapshot
      const snapshot = toSnapshot({
        html: draft.html,
        citations: draft.citations,
        annotations: draft.annotations
      });
      savedSnapshotsRef.current.set(sectionId, snapshot);
      pendingSnapshotsRef.current.set(sectionId, snapshot);

      setDrafts((prevDrafts) => {
        const newDrafts = new Map(prevDrafts);
        newDrafts.set(sectionId, {
          ...draft,
          version: savedDraft.version,
          updatedAt: savedDraft.updatedAt,
          lastSavedAt: savedDraft.updatedAt,
          isSaving: false,
          hasUnsavedChanges: false
        });
        return newDrafts;
      });
    } catch (err) {
      if (!mountedRef.current) return;

      setDrafts((prevDrafts) => {
        const newDrafts = new Map(prevDrafts);
        newDrafts.set(sectionId, {
          ...draft,
          isSaving: false,
          error: (err as Error).message
        });
        return newDrafts;
      });
    }
  }, [projectId, drafts]);

  const saveAllDrafts = useCallback(async () => {
    const promises = Array.from(drafts.keys()).map((sectionId) => saveSectionDraft(sectionId));
    await Promise.all(promises);
  }, [drafts, saveSectionDraft]);

  const isAnySaving = useMemo(() => {
    return Array.from(drafts.values()).some((draft) => draft.isSaving);
  }, [drafts]);

  const hasAnyUnsavedChanges = useMemo(() => {
    return Array.from(drafts.values()).some((draft) => draft.hasUnsavedChanges);
  }, [drafts]);

  const value = useMemo<MultiSectionContextValue>(
    () => ({
      projectId,
      sections,
      drafts,
      activeSectionId,
      setActiveSectionId,
      updateSectionHtml,
      saveSectionDraft,
      saveAllDrafts,
      isLoading,
      error,
      isAnySaving,
      hasAnyUnsavedChanges
    }),
    [
      projectId,
      sections,
      drafts,
      activeSectionId,
      setActiveSectionId,
      updateSectionHtml,
      saveSectionDraft,
      saveAllDrafts,
      isLoading,
      error,
      isAnySaving,
      hasAnyUnsavedChanges
    ]
  );

  return <MultiSectionContext.Provider value={value}>{children}</MultiSectionContext.Provider>;
}

export function useMultiSection() {
  const context = useContext(MultiSectionContext);
  if (!context) {
    throw new Error('useMultiSection must be used within MultiSectionProvider');
  }
  return context;
}
