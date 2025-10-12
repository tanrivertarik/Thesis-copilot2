# User Journey — Epics & User Stories

## Epic 1 — Onboarding & Project Setup
**Narrative:** Alex needs a fast, confidence-building setup to capture thesis intent and unlock AI support.

### User Story 1.1 — Sign Up
- **As** a new user, **I want** to register with email or Google **so that** I can access the app securely.
- **Acceptance Criteria:** OAuth + email flows succeed; new accounts land on project creation screen; welcome email confirms setup.
- **Measurement:** Account activation rate ≥ 80%.
- **Dependencies:** Firebase Auth configuration.

### User Story 1.2 — Create Thesis Project
- **As** a logged-in user, **I want** to create a project with title, topic description, research questions, and citation style **so that** the system understands my thesis scope.
- **Acceptance Criteria:** Required fields validated; project saved to Firestore; user sees project dashboard with confirmation toast.
- **Measurement:** 70% of new users finish project setup.
- **Dependencies:** Firestore schema for projects.

### User Story 1.3 — Generate Thesis Constitution
- **As** a user, **I want** the app to generate a Thesis Constitution defining scope, tone, argument, and outline **so that** I have a foundation for drafting.
- **Acceptance Criteria:** Constitution generated via LLM prompt using project inputs; user can edit and save; constitution stored versioned in Firestore.
- **Measurement:** 60% of projects have a saved Constitution within first session.
- **Dependencies:** Prompt template, Constitution storage model.

## Epic 2 — Source Management & Ingestion
**Narrative:** Alex needs to centralize research materials and understand their contributions.

### User Story 2.1 — Upload Sources
- **As** a user, **I want** to upload PDF or `.txt` files **so that** they become part of my research corpus.
- **Acceptance Criteria:** Drag/drop and file picker support; upload progress indicator; file stored; formats validated.
- **Measurement:** Average of five uploads per project in week one.
- **Dependencies:** Storage bucket, file size limits, virus scanning policy.

### User Story 2.2 — Extract & Summarize
- **As** a user, **I want** the system to extract text, summarize key arguments, and generate citations **so that** I can quickly assess each source.
- **Acceptance Criteria:** Text extraction successful or flagged; summary ≤ 150 words; key arguments list; formatted citation (APA/MLA/Chicago) generated.
- **Measurement:** 90% extraction success rate; user edits per summary < 1 on average.
- **Dependencies:** `pdf-parse`, citation formatting library, LLM summarization prompt.

### User Story 2.3 — Manage Source Library
- **As** a user, **I want** a dashboard to view, search, and edit source details **so that** my research stays organized.
- **Acceptance Criteria:** Table/grid view with filters; inline editing; audit log of changes; link to original file.
- **Measurement:** ≥ 50% of users edit at least one extracted field.
- **Dependencies:** Firestore indexing, UI table component.

## Epic 3 — AI-Powered Drafting & Editing
**Narrative:** Alex overcomes writer's block by co-writing with AI grounded in trusted sources.

### User Story 3.1 — Generate Section Draft
- **As** a user, **I want** to select an outline section and receive a draft **so that** I can start iterating.
- **Acceptance Criteria:** Section selection list; prompt uses top-ranked source chunks; draft rendered with `[CITE:sourceId]` placeholders; traceable logs.
- **Measurement:** Average draft generation time < 15 seconds.
- **Dependencies:** Retrieval pipeline, Section Writer prompt, Firestore storage for drafts.

### User Story 3.2 — View Inline Citations
- **As** a user, **I want** clear placeholder citations linked to sources **so that** I trust the provenance.
- **Acceptance Criteria:** Hover reveals source metadata; clicking opens source summary; placeholders persist through edits.
- **Measurement:** Citation click-through rate ≥ 30%.
- **Dependencies:** Citation mapping table, editor plugin.

### User Story 3.3 — Edit Draft in Rich Text
- **As** a user, **I want** to edit AI-generated text **so that** my voice leads the final output.
- **Acceptance Criteria:** Rich-text editor with formatting; tracked changes saved; autosave every 30 seconds; undo history.
- **Measurement:** Average session length ≥ 10 minutes.
- **Dependencies:** Editor component (e.g., TipTap/Slate), Firestore real-time sync.

### User Story 3.4 — Contextual Rewrite Assistance
- **As** a user, **I want** to highlight text and ask the AI to rewrite with my edits in mind **so that** the flow stays consistent.
- **Acceptance Criteria:** Highlight + action menu; prompt includes original + user edits; result diffed before insert; user can accept or cancel.
- **Measurement:** 40% of sections use rewrite tool; satisfaction rating ≥ 4/5.
- **Dependencies:** Rewrite prompt chain, change tracking.

## Epic 4 — Finalization & Export
**Narrative:** Alex compiles polished sections into a submission-ready document.

### User Story 4.1 — Arrange Sections
- **As** a user, **I want** to reorder sections **so that** my thesis structure is correct.
- **Acceptance Criteria:** Drag-and-drop reordering; updates reflect in export order; warnings for incomplete sections.
- **Measurement:** 80% of projects reorder at least once.
- **Dependencies:** Section metadata, UI list component.

### User Story 4.2 — Export Draft with Bibliography
- **As** a user, **I want** to export a compiled thesis with automatically generated bibliography **so that** I can share it for review.
- **Acceptance Criteria:** `.docx` export includes title page, margins, page numbers; bibliography built from used sources; export logged.
- **Measurement:** Export success rate ≥ 95%.
- **Dependencies:** `docx` library, citation resolver, formatting templates.

### User Story 4.3 — Download Formatted `.docx`
- **As** a user, **I want** to download the thesis in Word format **so that** it meets academic standards.
- **Acceptance Criteria:** File downloads within 10 seconds; file size < 5 MB; formatting validated with test cases.
- **Measurement:** 70% of active projects export at least once per month.
- **Dependencies:** Hosting bandwidth, QA tests on templates.
