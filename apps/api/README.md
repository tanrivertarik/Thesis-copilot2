# Thesis Copilot API

This package contains the Node.js (Express) backend responsible for project orchestration, source processing, AI calls, and exports. The Phase 0 scaffold ships with TypeScript, modular routing, and baseline middleware (helmet, cors, morgan). Project CRUD, source ingestion (extraction + embeddings), retrieval, and Section Writer endpoints now persist to Firestore via the Firebase Admin SDK (with optional emulator support).

## Planned Structure
- `src/index.ts`: HTTP entry point and server bootstrap.
- `src/routes/`: Feature-specific routers (projects, sources, drafting, exports).
- `src/services/`: Business logic and integrations (Firestore, storage, LLM orchestration).
- `src/config/`: Runtime configuration (Firebase, OpenRouter, logging).

## Scripts
- `pnpm dev` — Run the Express server with live reload via `tsx watch`.
- `pnpm build` — Emit compiled JavaScript (`dist/`) and declaration files.
- `pnpm start` — Execute the compiled server.
- `pnpm lint` — Lint `src/` with the workspace ESLint configuration.
- `pnpm typecheck` — Type-check without emitting.

## Environment
Copy `.config/env/local.example.env` and set:

```
PORT=3001
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
OPENROUTER_API_KEY=
```

> `FIREBASE_ADMIN_*` credentials are required (emulator or service account). `OPENROUTER_API_KEY` is optional locally—without it, the API falls back to deterministic mocks.

### Local development checklist
1. Install Firebase tools (`npm i -g firebase-tools`) and run `firebase emulators:start --only firestore` from `infra/firebase` (rules apply automatically).
2. Set `FIRESTORE_EMULATOR_HOST=localhost:8080` when using the emulator (see `.config/env/local.example.env`).
3. Provide service account credentials (copy JSON into env vars or set `GOOGLE_APPLICATION_CREDENTIALS`).
4. Ensure the frontend supplies a Firebase ID token in the `Authorization: Bearer <token>` header; anonymous/mock headers are no longer accepted.

## REST Endpoints (Phase 0 stubs)
- `GET /api/projects` — List projects for the current user (mock auth via `x-user-id` header, defaults to `demo-user`).
- `POST /api/projects` — Create a project (Zod validation via shared schemas).
- `GET /api/projects/:projectId` — Retrieve a single project.
- `PATCH /api/projects/:projectId` — Update mutable project fields.
- `DELETE /api/projects/:projectId` — Remove a project.
- `GET /api/projects/:projectId/sources` — List sources for a project.
- `POST /api/sources` — Create a source placeholder (with optional inline upload payload).
- `POST /api/sources/:sourceId/upload` — Attach raw content (`TEXT` or base64 `PDF`) prior to ingestion.
- `POST /api/sources/:sourceId/ingest` — Run extraction → chunking → OpenRouter embeddings + summarisation and persist chunks.
- `POST /api/retrieval/query` — Embed a query via OpenRouter and return cosine-ranked chunks.
- `POST /api/drafting/section` — Call OpenRouter Gemini (or fallback) to generate grounded section drafts with `[CITE:chunkId]` placeholders.

Example curl (lists projects with the mock auth header):

```bash
curl -H "x-user-id: demo-user" http://localhost:3001/api/projects
```

## Next Steps
1. Harden Firestore data access with proper security rules and Firebase Auth token verification (replace mock `x-user-id`).
2. Move ingestion + retrieval to background workers/queues and add persistence for chunk embeddings in a dedicated vector store (e.g., Firestore + Vertex AI Matching Engine, LanceDB).
3. Harden OpenRouter calls with retry/backoff, observe token spend, and expose telemetry metrics.
