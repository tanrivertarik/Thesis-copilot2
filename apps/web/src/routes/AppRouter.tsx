import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { LandingScene } from './home/LandingScene';
import { OnboardingLayout } from './onboarding/OnboardingLayout';
import { OnboardingOverview } from './onboarding/OnboardingOverview';
import { ProjectDetailsStep } from './onboarding/ProjectDetailsStep';
import { DeepResearchStep } from './onboarding/DeepResearchStep';
import { ResearchInputsStep } from './onboarding/ResearchInputsStep';
import { SummaryStep } from './onboarding/SummaryStep';
import { ThesisMetadataStep } from './onboarding/ThesisMetadataStep';
import { Dashboard } from './dashboard/Dashboard';
import { DashboardWithSidebar } from './dashboard/DashboardWithSidebar';
import { ImprovedDashboard } from './dashboard/ImprovedDashboard';
import { ProfessionalDashboard } from './dashboard/ProfessionalDashboard';
import { WorkspaceHome } from './workspace/WorkspaceHome';
import { SourceManagement } from './workspace/sources/SourceManagement';
import { EditorShell } from './editor/EditorShell';
import { Login } from './auth/Login';
import { RequireAuth } from './shared/RequireAuth';
import AnimationShowcase from './AnimationShowcase';

const router = createBrowserRouter([
  // Standalone routes (no AppLayout wrapper)
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        <ProfessionalDashboard />
      </RequireAuth>
    )
  },
  {
    path: '/dashboard-v2',
    element: (
      <RequireAuth>
        <ImprovedDashboard />
      </RequireAuth>
    )
  },
  {
    path: '/dashboard-old',
    element: (
      <RequireAuth>
        <DashboardWithSidebar />
      </RequireAuth>
    )
  },
  // Main app with AppLayout wrapper
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
            path: 'research',
            element: <DeepResearchStep />
          },
          {
            path: 'sources',
            element: <ResearchInputsStep />
          },
          {
            path: 'summary',
            element: <SummaryStep />
          },
          {
            path: 'metadata',
            element: <ThesisMetadataStep />
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
        path: 'workspace/sources',
        element: (
          <RequireAuth>
            <SourceManagement />
          </RequireAuth>
        )
      },
      {
        path: 'workspace/drafting',
        element: (
          <RequireAuth>
            <EditorShell />
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
      },
      {
        path: 'animation-showcase',
        element: <AnimationShowcase />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
