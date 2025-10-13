# System Patterns

## Architecture Overview
- **Apps**
  - `apps/web`: Vite + React SPA using Chakra UI for theming and TipTap for the rich-text editor.
  - `apps/api`: Express server (Node) exposing REST endpoints backed by Firebase Admin SDK (Firestore).
- **Packages**
  - `packages/shared`: Zod schemas and TypeScript types shared across API and web clients.
  - `packages/prompting`: Houses prompt templates (future expansion).

## Key Flows
1. **Onboarding**
   - React router defines `/onboarding` routes nested under `OnboardingLayout`.
   - `OnboardingContext` fetches or creates projects via REST, stores drafts in localStorage, and exposes navigation handlers.
   - Recent update introduces progress component and keyboard navigation (Alt+Arrow).
2. **Draft Lifecycle**
   - `DraftProvider` fetches/saves drafts through API client (`fetchDraft`, `saveDraft`) hitting `/api/projects/:id/drafts/:sectionId`.
   - Autosave applies snapshot diffing with debounced writes; manual save shares same pipeline.
   - Rewrite requests call `/api/drafting/rewrite` and update TipTap content selectively.
3. **Citation Handling**
   - Draft schema includes `DraftCitation` records; TipTap extension highlights `[CITE:*]` tokens.
   - Citation sidebar offers contextual metadata and quick insert into editor selection.

## Backend Patterns
- Firestore collections: `projects`, `sources`, `drafts`, auxiliary chunk collections.
- Draft service composes doc IDs as `${projectId}_${sectionId}` for quick lookup.
- Version history stored inline with a capped array to avoid heavy historical storage.
- OpenRouter integration centralized in `apps/api/src/ai/openrouter.ts` with graceful fallback when API key missing.

## Frontend Patterns
- Shared layout `PageShell` provides consistent header/actions across views.
- API hooks reside in `apps/web/src/lib/api.ts`, encapsulating auth token handling and error redirects.
- State contexts (Onboarding, Draft) abstract data fetching + local state, reducing prop drilling.
- TipTap custom extension modules housed under `components/extensions` for reusability.

## Critical Implementation Paths
- Authentication: Firebase Auth ID token required for all API requests; failures trigger logout and redirect to `/login`.
- Draft rewrites: relies on accurate paragraph detection and consistent placeholder preservation to prevent citation drift.
- Onboarding local drafts: localStorage hydration must occur before fetching project to avoid overwriting unsaved data.
