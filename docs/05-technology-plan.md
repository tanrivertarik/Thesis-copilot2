# Technology & Implementation Plan

## Stack Overview
- **Frontend:** React.js (Vite or Next.js standalone), TypeScript, component library (Chakra UI or MUI), TipTap/Slate editor for rich text. Hosted on Firebase Hosting or Vercel.
- **Backend:** Node.js (Express.js) with modular routing. Deploy as Firebase Functions or containerized service. Handles authentication hooks, source processing, prompt orchestration, export requests.
- **Data:** Firebase Firestore (projects, users, sources, drafts), Firebase Storage (raw uploads, generated artifacts), optional Redis cache for prompt context.
- **AI Provider:** OpenRouter accessing `gemini/gemini-2.5-pro` for heavy generation and `gemini/gemini-flash` for summarization/lightweight tasks.
- **Document Utilities:** `pdf-parse` for extraction, `langchain`/`lancedb` for embeddings + retrieval, `docx` for export formatting.

## Core Services
1. **Project Service**
   - CRUD for projects, Thesis Constitution versions, outline structure.
   - Enforces per-user limits (Free vs. Pro).
2. **Source Service**
   - Upload management, text extraction, summarization, citation formatting.
   - Stores chunk metadata and embeddings for retrieval.
3. **Drafting Service**
   - Section Writer orchestrates retrieval → prompt → post-processing.
   - Citation placeholder generator ensures `[CITE:sourceId]` tokens map to source IDs.
4. **Editing Service**
   - Manages draft revisions, tracks user edits vs. AI output.
   - Rewrite endpoint accepts user-highlighted text and returns adjusted prose.
5. **Export Service**
   - Builds ordered section list, resolves citations, compiles `.docx` file, stores download link.

## Data Flow (Section Draft)
1. User selects section; frontend requests latest outline and selected sources.
2. Backend fetches relevant source chunks via embeddings similarity.
3. Prompt constructed with Thesis Constitution, section brief, and top chunks.
4. LLM returns draft with placeholders; backend validates citations and stores draft.
5. Frontend renders draft in editor with placeholder metadata.

## Security & Compliance
- Enforce Firebase Auth tokens on all requests; role-based rules for Firestore/Storage.
- Document PII redaction optional toggle for sensitive data.
- Logging with rotation; store prompt/response metadata for debugging (without full text unless user consents).

## Testing Strategy
- Unit tests for prompt builders and citation resolver.
- Integration tests for upload → summary flow using fixture PDFs.
- Snapshot tests for `.docx` output formatting.
- Load tests on Section Writer to ensure latency under concurrency.

## Operational Considerations
- Rate limit LLM calls per user to manage cost.
- Monitor token usage, extraction failures, export errors.
- Establish feature flag system for Should-Have/Could-Have releases.

## Open Questions
- Will exports run synchronously or via background job queue?
- Should we integrate analytics (Mixpanel/Amplitude) in MVP or post-beta?
- How are large PDFs (>20MB) handled—chunking client-side or server-side streaming?
