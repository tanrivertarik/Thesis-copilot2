# Active Context

## Current Focus
- Extend frontend onboarding into a multi-step wizard with persistence, progress UI, and keyboard navigation.
- Build source ingestion UI upgrades (PDF drag-drop, status tracking, re-run) to unlock richer evidence pipelines.
- Enhance workspace dashboards with draft statuses, ingestion metrics, and quick actions while refining auth UX.

## Recent Changes
- Implemented draft persistence across web + API with autosave, manual save, and citation-aware context.
- Added TipTap editor toolbar, citation highlighting, and paragraph-level rewrite requests with preview/apply/undo.
- Created Firestore draft service and REST routes for GET/PUT drafts and paragraph rewrite endpoints.
- Upgraded onboarding state management with localStorage hydration, shared drafts, and Alt+Arrow navigation between steps.

## Next Steps
1. Design and implement the richer source upload interface (drag/drop, ingestion progress, re-run).
2. Connect workspace overview to drafts, retrieval quick actions, and status tags.
3. Fill in backend services for constitution generation, ingestion pipeline, and retrieval optimization.
4. Plan integration tests (Firestore emulator, mocked OpenRouter) and CI automation as services solidify.

## Key Decisions & Considerations
- Draft versions are persisted in Firestore with snapshots capped to 10 for lightweight history.
- Citation placeholders remain `[CITE:sourceId]` end-to-end; export resolver will transform later.
- Onboarding wizard uses localStorage for resilience; revisit once multi-user team scenarios require server persistence.

## Learnings & Insights
- Aligning backend schemas in `@thesis-copilot/shared` accelerates API + client feature work.
- TipTap extensions provide lightweight UX wins (highlighting, toolbar) without compromising existing drafts.
- Autosave scheduling benefits from snapshot comparisons to avoid redundant writes and hint at upcoming collaborative features.
