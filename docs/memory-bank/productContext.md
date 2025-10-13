# Product Context

## Why This Project Exists
Graduate researchers spend significant time translating fragmented notes and sources into cohesive thesis drafts. Existing tools either focus on citation management or generic writing assistance, leaving a gap for grounded, citation-preserving AI support.

Thesis Copilot addresses this gap by combining structured onboarding, source ingestion, retrieval, and AI drafting into one guided workflow.

## Problems We Solve
- Disconnected tooling between research organization and drafting.
- AI assistants that hallucinate citations or ignore user edits.
- Manual effort to keep drafts synchronized with latest sources and project decisions.

## How It Should Work
1. **Onboarding** gathers thesis metadata, research questions, and initial sources, generating a persistent project record.
2. **Workspace** presents project snapshots, ingestion status, and entry points into drafting and exports.
3. **Editor** loads the latest section draft, enables rich text editing with citation awareness, and synchronizes changes via autosave.
4. **AI Services** (retrieval, drafting, rewrites) ground outputs in ingested sources and preserve `[CITE:sourceId]` tokens.
5. **Export (future)** resolves citations, assembles bibliography, and delivers DOCX/PDF files.

## User Experience Goals
- Make progress visible with clear onboarding steps and autosaved drafts.
- Give users confidence that citations remain intact across AI interactions.
- Offer fast iteration loops (manual edits, rewrite preview/undo, quick citation insertion).
- Surface next-best actions (ingest more sources, request retrieval, prepare export) from the workspace.
