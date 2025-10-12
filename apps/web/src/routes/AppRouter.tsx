import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { LandingScene } from './home/LandingScene';
import { OnboardingLanding } from './onboarding/OnboardingLanding';
import { WorkspaceHome } from './workspace/WorkspaceHome';
import { EditorShell } from './editor/EditorShell';

const router = createBrowserRouter([
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
        element: <OnboardingLanding />
      },
      {
        path: 'workspace',
        element: <WorkspaceHome />
      },
      {
        path: 'editor',
        element: <EditorShell />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
