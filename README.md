# Thesis Copilot

## Overview
Thesis Copilot is a web-based, AI-powered academic writing assistant that helps students move from research overwhelm to a submission-ready thesis while retaining full authorship control.

## Why It Matters
- Streamlines the jump from blank page to structured thesis outline.
- Keeps user-provided sources at the center to maintain academic integrity.
- Reduces time spent on manual citation management.
- Encourages iterative drafting and revision instead of one-shot generation.

## MVP Snapshot
- Guided onboarding flows for project creation and Thesis Constitution generation.
- Source ingestion pipeline for PDF and text files with summarization and citations.
- Section-specific AI drafting that references only approved sources.
- Rich-text editing workspace with inline citation placeholders.
- Single-click export to `.docx` with generated bibliography.

## Document Map
- `docs/01-executive-summary.md` — Vision, problem, solution framing.
- `docs/02-target-personas.md` — Primary persona detail and empathy mapping.
- `docs/03-user-journey.md` — Epics, user stories, and acceptance criteria.
- `docs/04-product-roadmap.md` — Prioritization, release milestones, dependencies.
- `docs/05-technology-plan.md` — Architecture stack, data flows, AI design.
- `docs/06-go-to-market-and-metrics.md` — Launch motion, pricing, KPI definitions.
- `docs/07-risks-and-mitigations.md` — Risk register with contingency plans.

## Technology Snapshot
- Frontend: React.js + Firebase Hosting for rapid iteration.
- Backend: Node.js (Express) running serverless or containerized, integrated with Firebase Auth & Firestore.
- AI: OpenRouter access to `gemini/gemini-2.5-pro` for generation and `gemini/gemini-flash` for lightweight tasks.
- Document services: `pdf-parse` for extraction, `langchain`/`lancedb` for retrieval, `docx` for exports.

## Current Status
The project is in planning. Documentation in `docs/` is the single source of truth for product, engineering, and go-to-market alignment.

## Phase 0 Repository Layout
```
.
├── apps/
│   ├── api/            # Express backend (Firestore persistence, ingestion, retrieval)
│   └── web/            # React frontend scaffold (Chakra UI + router + Firebase bootstrap)
├── packages/
│   ├── prompting/      # Prompt templates, builders, validators
│   └── shared/         # Shared types, schemas, utilities
├── infra/
│   ├── firebase/       # Hosting, rules, emulator configs
│   └── observability/  # Logging and metrics configuration
├── scripts/            # Dev and CI helper scripts
├── tests/              # Cross-app automated test suites
└── .config/env/        # Environment variable templates
```

### Phase 0 Next Steps
- Implement Firebase Auth flows and onboarding UI modules in the web app (`apps/web`).
- Tighten backend security: verify Firebase ID tokens and add Firestore/Storage security rules.
- Run `firebase init` to populate `infra/firebase` with hosting, rules, and emulator settings.
- Extend environment templates for backend services (OpenRouter keys, Firestore emulator toggles).
- Decide on shared logging/telemetry utilities for both apps.

## Testing & Emulators
- **Unit/Lint:** `pnpm lint`, `pnpm --filter @thesis-copilot/api typecheck`, `pnpm --filter @thesis-copilot/web typecheck`.
- **Firestore integration (planned):**
  1. Install Firebase tools: `npm i -g firebase-tools`.
  2. From `infra/firebase/`, run `firebase emulators:start --only firestore --import ./seed --export-on-exit` (once seeding scripts land, the `seed` folder will hold fixture data).
  3. Start the API with `FIRESTORE_EMULATOR_HOST=localhost:8080` so all reads/writes hit the emulator.
  4. Run integration tests (to be added under `tests/` with Vitest/Playwright) that create projects, ingest sources, and verify drafting endpoints without touching production data.
- **Auth workflow:** Enable Google Sign-In provider in Firebase console; the frontend retrieves Firebase ID tokens and the API validates them with Firebase Admin.
