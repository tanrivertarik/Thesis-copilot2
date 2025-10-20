# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thesis Copilot is an AI-powered academic writing assistant that helps graduate students structure, draft, and finalize theses using their uploaded research sources. The core philosophy is **"copilot, not autopilot"** - the AI assists, but the user maintains full authorship and control.

### Critical Design Principles

1. **Source-Locked AI**: All AI-generated content MUST be grounded in user-uploaded sources. This is non-negotiable for academic integrity.
2. **Citation Transparency**: Use `[CITE:sourceId]` placeholders to ensure every claim is traceable to specific source chunks.
3. **User Control**: The user is the author; AI provides suggestions and drafts, never final decisions.
4. **No Hallucination**: AI responses are validated against provided source material.

## Monorepo Architecture

This is a pnpm workspace monorepo with clear separation of concerns:

```
apps/
  api/          # Express backend - business logic, AI integration, data persistence
  web/          # React frontend - user interface, TipTap editor
packages/
  shared/       # Zod schemas for type-safe API contracts (CRITICAL)
  prompting/    # AI prompt templates and builders
infra/
  firebase/     # Firestore rules, indexes, emulator config
tests/          # Integration test suite (18/18 passing)
```

### Critical Data Flow Pattern

**Example: Generating a Draft Section**

1. **Frontend** sends request to `/api/drafting/section` with projectId and sectionId
2. **Backend drafting-service**:
   - Calls `retrieval-service` to fetch relevant chunks from user's sources in Firestore
   - Uses `packages/prompting` to construct prompt with source chunks as context
   - Sends prompt to AI model via OpenRouter (`gemini/gemini-2.5-pro`)
   - Validates AI response contains `[CITE:sourceId]` placeholders
   - Saves draft to Firestore `drafts` collection
3. **Shared schemas** validate request/response payloads end-to-end
4. **Frontend** displays draft in TipTap editor with real-time sync

**Key Insight**: The retrieval-service acts as a gatekeeper - AI only sees source chunks the user uploaded, preventing hallucination.

## Development Commands

### Running Full Stack Locally

```bash
# 1. Start Firebase emulators (required for local development)
cd infra/firebase
firebase emulators:start --only auth,firestore

# 2. Start API server (in new terminal)
pnpm --filter @thesis-copilot/api dev

# 3. Start web app (in new terminal)
pnpm --filter @thesis-copilot/web dev
```

**Access Points**:
- Web: http://localhost:5173 (or 5174)
- API: http://localhost:3001
- Firebase UI: http://localhost:4000

### Building and Type Checking

```bash
# Build all packages in dependency order
pnpm build

# Type check without emitting files
pnpm typecheck

# Lint all packages
pnpm lint

# Build single package
pnpm --filter @thesis-copilot/shared build
```

### Testing

```bash
# Run all tests
pnpm test

# Run integration tests (requires Firebase emulator running)
FIRESTORE_EMULATOR_HOST=localhost:8080 pnpm test:integration

# Run tests with coverage
pnpm test -- --coverage
```

## Core Technologies & Patterns

### Backend (apps/api)

**Tech Stack**:
- Node.js + Express + TypeScript
- Firebase Admin SDK for Firestore + Auth
- OpenRouter API for AI models
- Zod for runtime validation

**Service Architecture**:
- `services/` contains ALL business logic (never put logic in routes)
- `routes/` are lightweight controllers that validate and delegate
- `middleware/auth.ts` verifies Firebase ID tokens on all protected routes
- `utils/errors.ts` provides comprehensive error handling with 40+ error codes

**AI Integration Pattern**:
```typescript
// services/drafting-service.ts example
import { generateChatCompletion } from '../ai/openrouter.js';

// 1. Build prompt with source context
const systemPrompt = `You are Thesis Copilot...`;
const userPrompt = `Source chunks: ${chunks.map(c => c.text).join('\n\n')}`;

// 2. Call AI with retry logic
const response = await withRetry(() =>
  generateChatCompletion({ systemPrompt, userPrompt, temperature: 0.35 })
);

// 3. Validate citations are present
if (!response.output.includes('[CITE:')) {
  throw new DraftingError('Missing citation placeholders');
}
```

**Key Services**:
- `drafting-service.ts`: AI content generation with citation validation
- `retrieval-service.ts`: Vector-based source chunk retrieval
- `draft-service.ts`: Draft CRUD operations with Firestore
- `source-service.ts`: PDF processing and text extraction
- `constitution-service.ts`: Thesis structure generation

### Frontend (apps/web)

**Tech Stack**:
- React 19 + TypeScript + Vite
- Chakra UI for components
- TipTap (ProseMirror) for rich text editing
- React Router for navigation
- TanStack Query for server state

**State Management**:
- React Context for global state (current user, auth)
- TanStack Query for server state (caching, refetching, optimistic updates)
- Component state for local UI state
- Custom providers in `src/app/providers/` for complex cross-component state

**Editor Architecture**:
The document editor uses TipTap with custom extensions:
- `CitationHighlightExtension`: Highlights `[CITE:sourceId]` placeholders
- `DiffAdditionMark` / `DiffDeletionMark`: Show AI edit suggestions
- Real-time streaming: Tokens append to editor as AI generates

**AI Chat Panel** (apps/web/src/routes/editor/components/AIChatPanel.tsx):
- Left sidebar chat interface with message threading
- Status transitions: 🤔 Thinking → ✍️ Writing → ✅ Complete
- Tool calling for structured document edits (insert, replace, delete, rewrite)
- Real-time token streaming synchronized with document editor

### Shared Package (packages/shared)

**CRITICAL**: This package is the source of truth for all data contracts.

When adding/modifying data structures:
1. Update Zod schema in `packages/shared/src/schemas/`
2. Export types from schema file
3. Rebuild shared package: `pnpm --filter @thesis-copilot/shared build`
4. Both frontend and backend automatically get updated types

**Example**:
```typescript
// packages/shared/src/schemas/drafting.ts
export const SectionDraftRequestSchema = z.object({
  projectId: IdSchema,
  sectionId: IdSchema,
  chunks: z.array(SourceChunkSchema),
  // ...
});

export type SectionDraftRequest = z.infer<typeof SectionDraftRequestSchema>;

// Backend uses schema for validation
const parsed = SectionDraftRequestSchema.safeParse(req.body);

// Frontend gets type safety
const request: SectionDraftRequest = { ... };
```

## AI Implementation Guidelines

### OpenRouter Models

- **Heavy Generation** (`gemini/gemini-2.5-pro`): Thesis Constitution, Section Drafting
- **Lightweight Tasks** (`gemini/gemini-flash`): Summarization, Rewrites
- **Temperature Settings**: 0.3-0.4 for factual content, higher for creative tasks

### Prompt Engineering Rules

1. **Always include**: "Use [CITE:sourceId] format for citations"
2. **Always include**: "Only use provided source chunks, no external knowledge"
3. **Always include**: "Maintain academic tone and formal writing standards"
4. **Never allow**: Unsupported claims or invented citations

### Streaming Implementation

The app uses Server-Sent Events (SSE) for real-time AI generation:

**Backend** (`apps/api/src/routes/drafting-stream.ts`):
```typescript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');

// Send tokens as they arrive from AI
for await (const token of aiStream) {
  res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
}
```

**Frontend** (`apps/web/src/lib/hooks/useStreamingDraft.tsx`):
```typescript
const eventSource = new EventSource('/api/drafting/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'token') {
    onToken(data.content); // Append to editor
  }
};
```

## Firebase Patterns

### Firestore Collections

- `projects/`: Thesis metadata, constitution, outline structure
- `sources/`: Document metadata, extracted chunks, embeddings
- `drafts/`: Section content, citation placeholders, edit history
- `users/`: Auth info, subscription tiers, usage limits

### Security Rules

All API requests verify Firebase ID tokens in `Authorization: Bearer <token>` header via `apps/api/src/middleware/auth.ts`.

### Emulator Usage

Always use Firebase emulator for local development:
```bash
# Set environment variable for API
FIRESTORE_EMULATOR_HOST=localhost:8080

# Seed data
cd infra/firebase && npm run seed

# Reset data
cd infra/firebase && npm run reset
```

## Common Development Patterns

### Adding a New API Endpoint

1. **Define schema** in `packages/shared/src/schemas/`:
   ```typescript
   export const MyRequestSchema = z.object({ ... });
   export type MyRequest = z.infer<typeof MyRequestSchema>;
   ```

2. **Create service** in `apps/api/src/services/my-service.ts`:
   ```typescript
   export async function myBusinessLogic(userId: string, request: MyRequest) {
     // All business logic here, not in route
   }
   ```

3. **Create route** in `apps/api/src/routes/my-routes.ts`:
   ```typescript
   router.post('/my-endpoint', asyncHandler(async (req: AuthedRequest, res) => {
     const parsed = MyRequestSchema.safeParse(req.body);
     if (!parsed.success) throw new HttpError(400, parsed.error.message);

     const result = await myBusinessLogic(req.user.id, parsed.data);
     res.json({ data: result });
   }));
   ```

4. **Register route** in `apps/api/src/routes/index.ts`:
   ```typescript
   app.use('/api', myRouter);
   ```

5. **Add API function** in `apps/web/src/lib/api.ts`:
   ```typescript
   export async function callMyEndpoint(payload: MyRequest): Promise<MyResponse> {
     return request<MyResponse>('/api/my-endpoint', {
       method: 'POST',
       body: JSON.stringify(payload)
     });
   }
   ```

### Error Handling

Always use typed errors from `apps/api/src/utils/errors.ts`:

```typescript
import { ValidationError, ErrorCode } from '../utils/errors.js';

if (!request.projectId) {
  throw new ValidationError(
    ErrorCode.MISSING_REQUIRED_FIELD,
    'Project ID is required',
    { userId, projectId: request.projectId }
  );
}
```

The error handler middleware automatically formats these into user-friendly messages.

### Authentication Flow

**Frontend**:
```typescript
// Get Firebase ID token
const token = await getIdToken();

// Include in API requests
fetch('/api/endpoint', {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Backend**:
```typescript
// Middleware verifies token and attaches user to request
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = await admin.auth().verifyIdToken(token);
  req.user = { id: decoded.uid, email: decoded.email };
  next();
};
```

## Recent Major Features

### AI Chat Panel with Tool Calling

**Location**: `apps/web/src/routes/editor/components/AIChatPanel.tsx`

The editor now has a professional chat panel (left sidebar) that:
- Shows AI status transitions (thinking → writing → complete)
- Streams tokens in real-time as AI generates
- Processes natural language commands ("Make it shorter", "Add more citations")
- Returns structured edit operations (insert, replace, delete, rewrite)

**Backend**: `apps/api/src/services/drafting-service.ts::processAICommand()`
- Accepts user command + current document HTML
- Returns JSON with operation type and content
- Validates all citations are preserved

### Document Export (DOCX)

**Location**: `apps/api/src/services/export-service.ts`

Exports sections/projects to DOCX with:
- Proper heading hierarchy
- Citation formatting
- Bibliography generation
- Custom filename from section title

### Streaming Draft Generation

**Location**: `apps/api/src/routes/drafting-stream.ts`

Real-time draft generation with:
- Server-Sent Events for token streaming
- Live updates in TipTap editor
- Automatic saving when complete
- Error recovery with retry logic

## Testing Patterns

### Integration Tests

Located in `tests/integration/`, these tests:
- Use Firebase emulator (must be running)
- Hit actual API endpoints
- Validate end-to-end flows
- Test error handling and recovery

**Example**:
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';

describe('Drafting API', () => {
  it('should generate section draft', async () => {
    const response = await request(app)
      .post('/api/drafting/section')
      .set('Authorization', `Bearer ${testToken}`)
      .send(validPayload);

    expect(response.status).toBe(200);
    expect(response.body.data.draft).toContain('[CITE:');
  });
});
```

## Important Constraints

1. **Never modify shared schemas without rebuilding**: Run `pnpm --filter @thesis-copilot/shared build` after any schema change
2. **Never put business logic in routes**: All logic belongs in `services/`
3. **Always validate with Zod schemas**: Never trust user input
4. **Always verify citations**: AI responses must include `[CITE:sourceId]` placeholders
5. **Always use Firebase emulator**: Never test against production Firestore
6. **Always use error classes**: Never throw raw Error objects
7. **Never skip authentication**: All routes (except /health) must verify tokens

## Environment Setup

Both apps require environment variables. See `.env.example` files:

**API** (`apps/api/.env.local`):
```
OPENROUTER_API_KEY=your_key_here
FIRESTORE_EMULATOR_HOST=localhost:8080  # For local dev
```

**Web** (`apps/web/.env.local`):
```
VITE_API_BASE_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your_key_here
```

Demo auth automatically creates `demo@thesis-copilot.test` user for development.
