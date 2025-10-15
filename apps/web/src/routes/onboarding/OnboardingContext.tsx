import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  SourceIngestionResult
} from '@thesis-copilot/shared';
import {
  createProject,
  updateProject,
  fetchProjects,
  createSource,
  ingestSource
} from '../../lib/api';

export type ProjectFormValues = {
  title: string;
  topic: string;
  researchQuestions: string;
  thesisStatement?: string;
  citationStyle: ProjectCreateInput['citationStyle'];
};

export type ResearchFormValues = {
  title: string;
  text: string;
};

export type OnboardingNavigationHandlers = {
  onNext?: () => Promise<boolean | void> | boolean | void;
  onPrevious?: () => Promise<boolean | void> | boolean | void;
};

type StoredDrafts = {
  projectDraft: ProjectFormValues;
  researchDraft: ResearchFormValues;
};

type OnboardingContextValue = {
  project: Project | null;
  projectLoading: boolean;
  projectError: string | null;
  savingProject: boolean;
  saveProject: (values: ProjectFormValues) => Promise<void>;
  projectDraft: ProjectFormValues;
  updateProjectDraft: (updates: Partial<ProjectFormValues>) => void;
  resetProjectDraft: (draft?: ProjectFormValues) => void;
  ingestionResult: SourceIngestionResult | null;
  ingesting: boolean;
  ingestError: string | null;
  ingestFromText: (input: { title: string; text: string }) => Promise<void>;
  resetIngestion: () => void;
  researchDraft: ResearchFormValues;
  updateResearchDraft: (updates: Partial<ResearchFormValues>) => void;
  resetResearchDraft: (draft?: ResearchFormValues) => void;
  reloadProject: () => Promise<Project | null>;
  navigationHandlers: OnboardingNavigationHandlers;
  registerNavigationHandlers: (handlers: OnboardingNavigationHandlers) => () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

const STORAGE_KEY = 'thesis-copilot:onboarding';

const defaultProjectDraft: ProjectFormValues = {
  title: '',
  topic: '',
  researchQuestions: '',
  thesisStatement: '',
  citationStyle: 'APA'
};

const defaultResearchDraft: ResearchFormValues = {
  title: 'Initial research note',
  text: ''
};

function projectToDraft(project: Project): ProjectFormValues {
  return {
    title: project.title ?? '',
    topic: project.topic ?? '',
    researchQuestions: project.researchQuestions?.join('\n') ?? '',
    thesisStatement: project.thesisStatement ?? '',
    citationStyle: project.citationStyle ?? 'APA'
  };
}

function isMeaningfulDraft(draft: ProjectFormValues) {
  const { title, topic, researchQuestions, thesisStatement } = draft;
  return [title, topic, researchQuestions, thesisStatement]
    .some((value) => Boolean(value && value.trim().length > 0));
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [projectDraft, setProjectDraft] = useState<ProjectFormValues>(defaultProjectDraft);
  const [researchDraft, setResearchDraft] = useState<ResearchFormValues>(defaultResearchDraft);
  const [ingestionResult, setIngestionResult] = useState<SourceIngestionResult | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [navigationHandlers, setNavigationHandlers] = useState<OnboardingNavigationHandlers>({});

  const hasHydratedFromStorage = useRef(false);
  const storageProvidedProjectDraft = useRef(false);
  const loadLatestProject = useCallback(async () => {
    try {
      const projects = await fetchProjects();
      const latestProject = projects[0] ?? null;
      setProject(latestProject);
      if (latestProject && !storageProvidedProjectDraft.current) {
        setProjectDraft(projectToDraft(latestProject));
      }
      setProjectError(null);
      return latestProject;
    } catch (error) {
      setProjectError((error as Error).message);
      throw error;
    }
  }, [storageProvidedProjectDraft]);

  useEffect(() => {
    if (hasHydratedFromStorage.current) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredDrafts>;
        if (parsed.projectDraft) {
          setProjectDraft({ ...defaultProjectDraft, ...parsed.projectDraft });
          storageProvidedProjectDraft.current = isMeaningfulDraft(parsed.projectDraft);
        }
        if (parsed.researchDraft) {
          setResearchDraft({ ...defaultResearchDraft, ...parsed.researchDraft });
        }
      }
    } catch (error) {
      console.warn('[onboarding] failed to parse stored drafts', error);
    } finally {
      hasHydratedFromStorage.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedFromStorage.current) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const payload: StoredDrafts = {
      projectDraft,
      researchDraft
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [projectDraft, researchDraft]);

  useEffect(() => {
    loadLatestProject()
      .catch(() => undefined)
      .finally(() => {
        setProjectLoading(false);
      });
  }, [loadLatestProject]);

  const reloadProject = useCallback(async () => {
    setProjectLoading(true);
    try {
      return await loadLatestProject();
    } finally {
      setProjectLoading(false);
    }
  }, [loadLatestProject]);

  const saveProject = useCallback(async (values: ProjectFormValues) => {
    setSavingProject(true);
    setProjectError(null);
    try {
      const payload: ProjectCreateInput = {
        title: values.title,
        topic: values.topic,
        researchQuestions: values.researchQuestions
          .split('\n')
          .map((question) => question.trim())
          .filter(Boolean),
        thesisStatement: values.thesisStatement,
        citationStyle: values.citationStyle,
        visibility: 'PRIVATE',
        constitution: undefined
      };

      let saved: Project;
      if (project) {
        const updatePayload: ProjectUpdateInput = { ...payload };
        saved = await updateProject(project.id, updatePayload);
      } else {
        saved = await createProject(payload);
      }
      setProject(saved);
      setProjectDraft(values);
      storageProvidedProjectDraft.current = isMeaningfulDraft(values);
    } catch (error) {
      setProjectError((error as Error).message);
      throw error;
    } finally {
      setSavingProject(false);
    }
  }, [project]);

  const updateProjectDraft = useCallback((updates: Partial<ProjectFormValues>) => {
    setProjectDraft((prev) => {
      const next = { ...prev, ...updates };
      if (isMeaningfulDraft(next)) {
        storageProvidedProjectDraft.current = true;
      }
      return next;
    });
  }, []);

  const resetProjectDraft = useCallback((draft?: ProjectFormValues) => {
    const next = draft ?? (project ? projectToDraft(project) : defaultProjectDraft);
    setProjectDraft(next);
    storageProvidedProjectDraft.current = isMeaningfulDraft(next);
  }, [project]);

  const ingestFromText = useCallback(
    async ({ title, text }: { title: string; text: string }) => {
      if (!project) {
        setIngestError('Save your project details before adding sources.');
        return;
      }
      setIngesting(true);
      setIngestError(null);
      setIngestionResult(null);
      try {
        const source = await createSource({
          projectId: project.id,
          kind: 'TEXT',
          metadata: {
            title: title || `Inline note ${new Date().toLocaleString()}`
          },
          upload: {
            contentType: 'TEXT',
            data: text
          }
        });
        const result = await ingestSource(source.id);
        setIngestionResult(result);
        setResearchDraft(defaultResearchDraft);
      } catch (error) {
        setIngestError((error as Error).message);
        throw error;
      } finally {
        setIngesting(false);
      }
    },
    [project]
  );

  const resetIngestion = useCallback(() => {
    setIngestionResult(null);
    setIngestError(null);
    setResearchDraft(defaultResearchDraft);
  }, []);

  const updateResearchDraft = useCallback((updates: Partial<ResearchFormValues>) => {
    setResearchDraft((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetResearchDraft = useCallback((draft?: ResearchFormValues) => {
    setResearchDraft(draft ?? defaultResearchDraft);
  }, []);

  const registerNavigationHandlers = useCallback((handlers: OnboardingNavigationHandlers) => {
    setNavigationHandlers((prev) => {
      if (prev.onNext === handlers.onNext && prev.onPrevious === handlers.onPrevious) {
        return prev;
      }
      return handlers;
    });

    return () =>
      setNavigationHandlers((prev) => {
        if (prev.onNext === handlers.onNext && prev.onPrevious === handlers.onPrevious) {
          return {};
        }
        return prev;
      });
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      project,
      projectLoading,
      projectError,
      savingProject,
      saveProject,
      projectDraft,
      updateProjectDraft,
      resetProjectDraft,
      ingestionResult,
      ingesting,
      ingestError,
      ingestFromText,
      resetIngestion,
      researchDraft,
      updateResearchDraft,
      resetResearchDraft,
      reloadProject,
      navigationHandlers,
      registerNavigationHandlers
    }),
    [
      project,
      projectLoading,
      projectError,
      savingProject,
      saveProject,
      projectDraft,
      updateProjectDraft,
      resetProjectDraft,
      ingestionResult,
      ingesting,
      ingestError,
      ingestFromText,
      resetIngestion,
      researchDraft,
      updateResearchDraft,
      resetResearchDraft,
      reloadProject,
      navigationHandlers,
      registerNavigationHandlers
    ]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export function useOnboardingStepNavigation(handlers: OnboardingNavigationHandlers) {
  const { registerNavigationHandlers } = useOnboarding();

  useEffect(() => {
    const unregister = registerNavigationHandlers(handlers);
    return unregister;
  }, [handlers, registerNavigationHandlers]);
}
