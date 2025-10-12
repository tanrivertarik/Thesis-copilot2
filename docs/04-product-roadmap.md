# Product Roadmap & Prioritization

## MoSCoW Breakdown (V1.0 MVP — "The Draft Generator")
- **Must-Haves:** Authentication, project creation, Thesis Constitution, PDF/`.txt` ingestion, AI section drafting, placeholder citations `[CITE:sourceId]`, rich-text editor, `.docx` export with bibliography.
- **Should-Haves:** Post-outline section management, additional export formats (PDF, LaTeX), citation resolver that converts placeholders before export.
- **Could-Haves:** Plagiarism checker, advisor comments, advanced source tagging/folders, “Regenerate with my edits” loop.
- **Won’t-Haves:** Real-time collaboration, external reference manager sync, AI web search for new sources.

## Release Phases
### Phase 0 — Foundations (Weeks 1-2)
- Configure Firebase Auth/Firestore, scaffolding for React + Express.
- Define Firestore data models, storage buckets, and environment secrets.
- Ship design prototype of onboarding and dashboard flows.

### Phase 1 — Project Setup (Weeks 3-4)
- Implement sign-up/login and project creation forms.
- Ship Thesis Constitution prompt chain and editing UI.
- Validate Firestore reads/writes, establish unit tests.

### Phase 2 — Source Ingestion (Weeks 5-6)
- Build upload pipeline with extraction + summarization + citation generation.
- Deliver source dashboard with edit capabilities.
- Add basic analytics logging (Amplitude/GA stub).

### Phase 3 — Drafting Experience (Weeks 7-10)
- Implement retrieval-augmented Section Writer, citation placeholders.
- Launch rich-text editor and autosave.
- Introduce rewrite-with-edits helper as beta.

### Phase 4 — Export & QA (Weeks 11-12)
- Build section ordering manager and export queue.
- Deliver `.docx` formatter, bibliography assembly, smoke tests.
- Conduct usability testing, refine onboarding, prep beta release collateral.

## Milestone Metrics
- **Beta Readiness:** All Must-Haves complete, onboarding to export flow < 5 minutes in internal tests.
- **Post-Beta Iteration:** Should-Haves prioritized based on user feedback, telemetry instrumentation reaching 95% coverage for key actions.

## Dependencies & Risks
- Timely access to OpenRouter API keys and quotas.
- Reliable PDF parsing for varied academic documents.
- UI performance when rendering large documents in editor.
