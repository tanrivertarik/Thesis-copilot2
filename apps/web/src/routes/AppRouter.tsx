import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { LandingScene } from './home/LandingScene';
import { OnboardingLayout } from './onboarding/OnboardingLayout';
import { OnboardingOverview } from './onboarding/OnboardingOverview';
import { ProjectDetailsStep } from './onboarding/ProjectDetailsStep';
import { ResearchInputsStep } from './onboarding/ResearchInputsStep';
import { SummaryStep } from './onboarding/SummaryStep';
import { WorkspaceHome } from './workspace/WorkspaceHome';
import { EditorShell } from './editor/EditorShell';
import { Login } from './auth/Login';
import { RequireAuth } from './shared/RequireAuth';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LandingScene />
      },
      {
        path: 'onboarding',
        element: (
          <RequireAuth>
            <OnboardingLayout />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            element: <OnboardingOverview />
          },
          {
            path: 'start',
            element: <ProjectDetailsStep />
          },
          {
            path: 'sources',
            element: <ResearchInputsStep />
          },
          {
            path: 'summary',
            element: <SummaryStep />
          }
        ]
      },
      {
        path: 'workspace',
        element: (
          <RequireAuth>
            <WorkspaceHome />
          </RequireAuth>
        )
      },
      {
        path: 'editor',
        element: (
          <RequireAuth>
            <EditorShell />
          </RequireAuth>
        )
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
