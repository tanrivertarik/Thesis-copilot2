# Thesis Copilot Web App

React + TypeScript frontend scaffolded with Vite. This package will host the Thesis Copilot user experience: onboarding, Thesis Constitution editor, source workspace, AI drafting panels, and export flows.

## Scripts
- `pnpm dev` — Launch the Vite dev server with hot module reload.
- `pnpm build` — Type-check (`tsc -b`) and build a production bundle.
- `pnpm typecheck` — Run TypeScript project references without emitting artifacts.
- `pnpm lint` — Lint `src/` with the workspace-level ESLint configuration.
- `pnpm preview` — Serve the production build locally.

## Project Structure
- `src/app/providers/` — Application-level providers (Firebase Auth, Chakra UI, router).
- `src/routes/` — React Router configuration, layouts, and scene components.
- `src/lib/env.ts` — Validates Vite environment variables before Firebase initialization.
- `src/theme/` — Chakra theme tokens and component overrides.
- `public/` — Static assets served by Vite.
- `tsconfig.app.json` — Extends the monorepo base config with Vite-specific overrides.
- `tsconfig.node.json` — Node/Vite tooling configuration.

## Environment Variables
Copy `.config/env/local.example.env` to `apps/web/.env.local` (or similar) and fill in Firebase project values:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_API_BASE_URL=http://localhost:3001
```

Enable the Google Sign-In provider in your Firebase console (`Authentication → Sign-in method`) so the login flow succeeds locally.

## Next Steps
1. Implement Firebase Auth flows (sign-in, sign-out) and protect workspace/editor routes.
2. Extract shared UI primitives (buttons, layout, typography) into `packages/shared`.
3. Flesh out onboarding flow routes (stepper, forms, Thesis Constitution preview).
4. Connect workspace/editor placeholders to real data once backend endpoints are ready.
