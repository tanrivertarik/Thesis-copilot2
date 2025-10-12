import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { LandingScene } from './home/LandingScene';
import { OnboardingLanding } from './onboarding/OnboardingLanding';
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
            <OnboardingLanding />
          </RequireAuth>
        )
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
