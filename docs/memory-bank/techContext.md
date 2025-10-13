# Tech Context

## Core Technologies
- **Frontend**: React 19, React Router 7, Vite 7, Chakra UI, TipTap (rich-text editor), Zod (validation), TypeScript 5.9.
- **Backend**: Node 20+, Express, Firebase Admin SDK (Firestore), OpenRouter (LLM access), Zod schemas.
- **Shared**: Workspace-managed packages via PNPM with `workspace:*` dependencies for shared types.

## Development Tooling
- **Build/Test**: `pnpm` for package management, TypeScript project references, Vitest (available), Playwright planned.
- **Linting**: ESLint with TypeScript, React, hooks, and import rules (configured but not run automatically yet).
- **Formatting**: Implicit (no Prettier currently enforced).

## Environment & Configuration
- `.env` files consumed via custom `env.ts`; Firebase web config and API base URL configured per environment.
- Backend requires Firebase Admin credentials (`FIREBASE_ADMIN_*`) and optional `OPENROUTER_API_KEY`.
- Firestore emulator supported via `FIRESTORE_EMULATOR_HOST`.

## Deploy Targets (Planned)
- Web app: Firebase Hosting (`pnpm deploy:web` to be scripted).
- Backend: Cloud Functions/Cloud Run (decision pending; infrastructure folder ready for Firebase configs).

## Constraints & Considerations
- Firestore access pattern must remain per-user scoped; current services assume single owner ID.
- OpenRouter integration must gracefully degrade when API key absent (already echoes prompt for development).
- Autosave + rewrite flows require reliable ID token refresh; API client enforces logout on 401.
- Large file uploads (PDF ingestion) will need signed URL or resumable flow — not yet implemented.
