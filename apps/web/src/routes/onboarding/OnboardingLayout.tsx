import { Outlet } from 'react-router-dom';
import { OnboardingProvider } from './OnboardingContext';

export function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Outlet />
    </OnboardingProvider>
  );
}
