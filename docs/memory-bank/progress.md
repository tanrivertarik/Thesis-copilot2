# Progress Log

## What Works
- Authentication guard around router with Firebase ID tokens.
- Project CRUD via Firestore with sample seed data for demo user.
- Source ingestion (text notes) with chunking, summarization, and embedding stub.
- Workspace home showing project list and draft preview via retrieval + draft endpoints.
- Rich-text editor with autosave/manual save, citation highlighting, rewrite requests, and sidebar insertion.
- Onboarding wizard with persistent drafts, progress UI, and keyboard navigation.

## In Progress
- Enhanced source upload UI (PDF drag/drop, ingestion status feedback, re-run support).
- Workspace dashboard improvements (draft statuses, quick retrieval actions, ingestion progress).
- Backend services for constitution generation, advanced ingestion pipeline, retrieval optimization.
- Export pipeline (citation resolver, DOCX/PDF generation) – planning stage.

## Next Planned Work
1. Deliver source ingestion UI revamp and hook into existing ingestion endpoints.
2. Expand workspace UX to surface draft lifecycle status and shortcuts into editor/retrieval.
3. Implement AI constitution generation with versioning and connect summary step to the service.
4. Establish testing strategy (unit, integration with Firestore emulator, Playwright E2E) and CI automation.

## Known Issues & Risks
- Draft rewrite endpoint depends on project ownership enforcement only at service level; broader auth checks pending.
- Source ingestion currently limited to inline text; file uploads blocked until signed upload workflow implemented.
- Citation metadata in sidebar uses placeholders; needs linkage to real source records.
- No CI pipeline to catch regressions; manual typechecks only so far.

## Recent Milestones
- Added Firestore-backed draft storage layer with REST endpoints and version history.
- Upgraded editor to support toolbar actions, citation highlighting, rewrite preview/apply, and manual save.
- Introduced onboarding persistence with localStorage hydration and step-to-step keyboard navigation.
