export type OnboardingStep = {
  path: string;
  label: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { path: '/onboarding', label: 'Overview' },
  { path: '/onboarding/start', label: 'Project basics' },
  { path: '/onboarding/research', label: 'Deep research' },
  { path: '/onboarding/sources', label: 'Research inputs' },
  { path: '/onboarding/summary', label: 'Review' }
];

export function getOnboardingStepIndex(pathname: string): number {
  const exactIndex = ONBOARDING_STEPS.findIndex((step) => step.path === pathname);
  if (exactIndex >= 0) {
    return exactIndex;
  }
  const fallback = ONBOARDING_STEPS.findIndex((step) => pathname.startsWith(step.path));
  return fallback >= 0 ? fallback : 0;
}
