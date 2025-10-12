# AI Task Backlog

This document enumerates the AI-specific workstreams required to deliver Thesis Copilot's intelligent features. Each task captures scope, dependencies, data requirements, prompting details, validation strategies, and telemetry hooks so the AI team can implement and iterate efficiently.

## 1. Thesis Constitution Generator
- **Objective:** Produce a structured thesis brief (scope, tone, core argument, outline) from onboarding inputs.
- **Inputs:** Project metadata (title, topic description, research questions, citation style), optional user notes.
- **Process:**
  1. Normalize project data and validate required fields.
  2. Craft prompt including persona voice guidance (academic tone) and content boundaries.
  3. Request response from `gemini/gemini-2.5-pro`.
  4. Parse response into JSON schema (`scope`, `tone_guidelines`, `core_argument`, `outline.sections[]`).
  5. Persist constitution with versioning and timestamp.
- **Outputs:** Structured JSON stored in Firestore, plus rendered markdown for UI display.
- **Validation:** Schema validation, length limits per field, human review sample 10%.
- **Telemetry:** Log prompt token count, latency, response length, user edits post-generation.

## 2. Source Summarizer & Citation Builder
- **Objective:** Extract text from uploaded sources and summarize key insights with accurate citations.
- **Inputs:** Raw text from `pdf-parse` or user-provided `.txt`, detected metadata (title, author, publication year).
- **Process:**
  1. Segment text into chunks (~1,000 tokens) preserving structural cues (headings, citations).
  2. Run summarization prompt on `gemini/gemini-flash` to produce concise abstract and 3–5 bullet arguments.
  3. Generate citation entry matching selected style (APA/MLA/Chicago); fall back to template if metadata missing.
  4. Embed chunks using selected embedding model; store vector IDs and metadata in retrieval store.
- **Outputs:** Summary, bullet insights, formatted citation, embeddings written to Firestore + vector DB.
- **Validation:** Compare generated citation against style rules; unit test chunking edge cases; measure summarization length.
- **Telemetry:** Extraction success/failure codes, average tokens per document, user edits on summary/citation fields.

## 3. Retrieval Pipeline & Chunk Ranking
- **Objective:** Ensure Section Writer receives the most relevant source chunks with provenance.
- **Inputs:** Section context (from outline), optional user-provided keywords, embeddings store.
- **Process:**
  1. Build query vector using section topic + research questions + Thesis Constitution context.
  2. Perform semantic search (top-k) with fallback keyword filter.
  3. Score chunks by similarity + recency + user pinning.
  4. Assemble context bundle (max token budget) with citation metadata.
- **Outputs:** Ordered list of chunk payloads (text, sourceId, snippet position).
- **Validation:** Regression tests with synthetic queries; ensure diversity across sources; confirm token limits.
- **Telemetry:** Retrieval latency, chunk diversity metrics, user overrides (pin/exclude counts).

## 4. Section Writer
- **Objective:** Generate draft prose for a thesis section grounded exclusively in retrieved chunks.
- **Inputs:** Section brief, Thesis Constitution excerpt, ordered chunk bundle, citation style.
- **Process:**
  1. Compose prompt with explicit instructions: cite using `[CITE:sourceId]`, avoid unsupported claims, maintain academic tone.
  2. Call `gemini/gemini-2.5-pro` with temperature tuned for factuality (0.3–0.4).
  3. Post-process output:
     - Validate placeholder format.
     - Ensure every citation maps to an included chunk.
     - Segment into paragraphs for editor.
  4. Store draft and metadata (prompt ID, chunk IDs used).
- **Outputs:** Draft text with citation placeholders, provenance map (placeholder → chunk).
- **Validation:** Automated check for hallucinated citations; lexical similarity between draft and source chunks; human QA on sample outputs.
- **Telemetry:** Generation latency, token usage, placeholder count, user edits per paragraph.

## 5. Inline Citation Resolver
- **Objective:** Convert placeholders into formatted in-text citations during export.
- **Inputs:** Draft with `[CITE:sourceId]` tokens, source metadata, citation style rules.
- **Process:**
  1. Parse draft, collect unique placeholders in order of appearance.
  2. Map each sourceId to formatted citation (short form for inline, full for bibliography).
  3. Replace placeholders respecting style (APA parenthetical, etc.).
  4. Accumulate bibliography entries; dedupe identical citations.
- **Outputs:** Citation-resolved document sections, formatted bibliography list.
- **Validation:** Unit tests per citation style; ensure placeholder-less sections remain untouched; cross-check bibliography sorting rules.
- **Telemetry:** Placeholder conversion success rate, unmatched citations, export latency.

## 6. Rewrite Assistant (“Keep My Edits”)
- **Objective:** Offer localized rewrites that respect user edits and maintain context continuity.
- **Inputs:** Original AI draft paragraph, user-edited version, surrounding paragraph context, section goal.
- **Process:**
  1. Compute diff between original and edited text to highlight user-intent regions.
  2. Construct prompt for `gemini/gemini-flash` including diff summary and constraints (maintain citations, tone).
  3. Return revised paragraph with suggestion diff for preview.
- **Outputs:** Suggested rewrite, diff metadata enabling accept/reject workflow.
- **Validation:** Ensure citations preserved; detect regressions where model reintroduces removed claims; gather user satisfaction feedback.
- **Telemetry:** Rewrite request frequency, acceptance rate, average latency.

## 7. Quality Guardrails
- **Objective:** Monitor AI outputs for compliance, tone, and academic integrity.
- **Tasks:**
  - Implement automatic hallucination checks using retrieval overlap scoring.
  - Add banned content filters (e.g., explicit disclaimers for unsupported sources).
  - Introduce toxicity/academic tone classifier to flag out-of-spec responses.
  - Create moderation workflow for flagged drafts with human-in-the-loop resolution.
- **Validation:** Periodic evaluation with labeled datasets; track false positives/negatives.
- **Telemetry:** Flag rate per feature, resolution time, override counts.

## 8. Evaluation & Benchmarking
- **Objective:** Establish repeatable evaluation harness for AI components.
- **Tasks:**
  - Build dataset of anonymized sample theses and sources for offline testing.
  - Define metrics: factual consistency, citation accuracy, readability, user edit distance.
  - Automate nightly evaluation pipeline with regression thresholds.
- **Telemetry:** Store evaluation summaries, surface regressions in dashboard.

## 9. Cost & Latency Optimization
- **Objective:** Keep AI features performant and cost-effective.
- **Tasks:**
  - Track per-feature token spend; implement adaptive prompt truncation.
  - Cache retrieval results and partial generations where safe.
  - Experiment with model mix (flash vs. pro) and temperature settings.
- **Telemetry:** Token cost per active user, average response time per feature, cache hit rate.

## 10. Observability & Feedback Loop
- **Objective:** Close the loop between AI behavior and user feedback.
- **Tasks:**
  - Instrument user feedback buttons on AI outputs (thumbs up/down, comments).
  - Correlate feedback with prompt versions to inform prompt tuning.
  - Expose AI health metrics in internal dashboard (success rates, flagged outputs).
- **Telemetry:** Feedback volume, satisfaction trends, prompt version adoption.

---

**Next Steps:** Prioritize tasks based on roadmap phases (e.g., Constitution Generator and Source Summarizer for Phase 1–2). Convert each section into tickets with effort estimates, owners, and timelines aligned with the product roadmap.
