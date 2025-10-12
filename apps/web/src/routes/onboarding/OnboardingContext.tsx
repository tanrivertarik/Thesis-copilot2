import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

type OnboardingContextValue = {
  project: Project | null;
  projectLoading: boolean;
  projectError: string | null;
  savingProject: boolean;
  saveProject: (values: ProjectFormValues) => Promise<void>;
  ingestionResult: SourceIngestionResult | null;
  ingesting: boolean;
  ingestError: string | null;
  ingestFromText: (input: { title: string; text: string }) => Promise<void>;
  resetIngestion: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<SourceIngestionResult | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projects = await fetchProjects();
        setProject(projects[0] ?? null);
        setProjectError(null);
      } catch (error) {
        setProjectError((error as Error).message);
      } finally {
        setProjectLoading(false);
      }
    };

    loadProject();
  }, []);

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
    } catch (error) {
      setProjectError((error as Error).message);
      throw error;
    } finally {
      setSavingProject(false);
    }
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
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      project,
      projectLoading,
      projectError,
      savingProject,
      saveProject,
      ingestionResult,
      ingesting,
      ingestError,
      ingestFromText,
      resetIngestion
    }),
    [
      project,
      projectLoading,
      projectError,
      savingProject,
      saveProject,
      ingestionResult,
      ingesting,
      ingestError,
      ingestFromText,
      resetIngestion
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
