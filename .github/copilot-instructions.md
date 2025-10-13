# Thesis Copilot - AI Coding Assistant Guide

This guide provides essential context for AI coding assistants to be effective in the Thesis Copilot codebase.

## 1. Big Picture: What is Thesis Copilot?

Thesis Copilot is a web-based, AI-powered academic writing assistant. It helps students move from research to a submission-ready thesis while maintaining full control over authorship. The core philosophy is "copilot, not autopilot," meaning the AI assists, but the user makes all final decisions.

**Key Principles:**
- **Source-Locked AI:** All AI-generated text *must* be grounded in user-uploaded source documents. This is a hard requirement to prevent hallucination and ensure academic integrity.
- **Citation Transparency:** The system uses `[CITE:sourceId]` placeholders to ensure every claim is traceable to a specific source chunk. This is fundamental to the user experience.
- **User Control:** The user has ultimate editorial control. AI provides suggestions and drafts, but the user is the author and makes all final decisions.
- **Iterative Workflow:** The tool is designed for an iterative process of drafting, editing, and refining, rather than one-shot generation.

## 2. Monorepo Architecture

This is a pnpm monorepo with a clear separation of concerns between the frontend, backend, and shared packages.

- `apps/web`: The React/TypeScript frontend built with Vite and Chakra UI. This is the user-facing application where users manage projects, upload sources, and edit drafts.
- `apps/api`: The Node.js/Express backend that handles business logic, data persistence, and communication with external services. It serves as the brain of the operation.
- `packages/shared`: Contains shared code, primarily Zod schemas for type-safe data exchange between the frontend and backend. **This is critical for maintaining data consistency.**
- `packages/prompting`: Holds templates and builders for generating prompts sent to the AI models. This centralizes prompt engineering and makes it easier to iterate on prompts.
- `infra/firebase`: Configuration for Firebase services, including Firestore rules, indexes, and emulator settings.

### Detailed Data Flow: Example of Generating a Draft

1.  **Frontend (`apps/web`):** A user requests a draft for a thesis section. The request is sent to the backend API, including the project ID and section details.
2.  **Backend (`apps/api`):**
    a. The `drafting` route receives the request and calls the `drafting-service`.
    b. `drafting-service` uses the `retrieval-service` to fetch relevant text chunks from the user's uploaded sources stored in Firestore.
    c. The service then uses `packages/prompting` to construct a detailed prompt, including the retrieved source chunks as context.
    d. The prompt is sent to an AI model (e.g., `gemini/gemini-2.5-pro`) via the OpenRouter client in `src/ai/openrouter.ts`.
    e. The AI-generated text, including `[CITE:sourceId]` placeholders, is received.
    f. The draft is saved to the `drafts` collection in Firestore.
3.  **Shared Schemas (`packages/shared`):** Throughout this process, Zod schemas from this package are used to validate the request payload from the frontend and to ensure the data being saved to Firestore matches the expected structure.
4.  **Frontend (`apps/web`):** The newly created draft is sent back to the client and displayed in the editor.

## 3. Core Technologies

- **Frontend:** React, TypeScript, Vite, Chakra UI, React Router, TanStack Query for data fetching.
- **Backend:** Node.js, Express, TypeScript.
- **Database:** Firebase Firestore is the primary NoSQL database for storing all user data, including projects, sources, and drafts.
- **Authentication:** Firebase Authentication (specifically Google Sign-In) handles user sign-in. The frontend obtains a JWT, which is verified by a middleware on the backend.
- **AI Models:** AI capabilities are accessed through OpenRouter, primarily using `gemini/gemini-2.5-pro` for generation and `gemini/gemini-flash` for smaller tasks like summarization.
- **File Storage:** Firebase Storage is used for raw file uploads (e.g., PDFs of research papers).

## 4. Key Developer Workflows

### Running the Full Stack Locally

1.  **Start Firebase Emulator:** To develop locally without affecting production data, use the Firestore emulator. This is the recommended approach for all development.
    ```bash
    # From the infra/firebase directory
    firebase emulators:start --only firestore
    ```
2.  **Set Up Environment Variables:** Copy the `.env.example` files in `apps/api` and `apps/web` to `.env.local` and fill in the required Firebase and OpenRouter credentials. For local development, ensure `FIRESTORE_EMULATOR_HOST` is set for the API.
3.  **Start the API:**
    ```bash
    # In a new terminal, from the root directory
    pnpm --filter @thesis-copilot/api dev
    ```
4.  **Start the Web App:**
    ```bash
    # In another terminal, from the root directory
    pnpm --filter @thesis-copilot/web dev
    ```

### Testing

- **Run all tests:**
  ```bash
  pnpm test
  ```
- **Run integration tests:** These tests require the Firebase emulator to be running. They hit the actual API endpoints and interact with the emulated Firestore instance.
  ```bash
  FIRESTORE_EMULATOR_HOST=localhost:8080 RUN_INTEGRATION_TESTS=true pnpm test:integration
  ```

## 5. Important Code Patterns & Conventions

### Shared Schemas (`packages/shared`)

To maintain type safety and data integrity across the `api` and `web` apps, we use Zod schemas. When you add or modify a data structure that is sent between the frontend and backend, you **must** update the corresponding schema in `packages/shared/src/schemas`.

**Example:** The `ProjectCreationSchema` in `packages/shared/src/schemas/project.ts` defines the shape of the data required to create a new project. The API uses this schema to validate incoming requests.

### API Services (`apps/api/src/services`)

All business logic and interaction with external services (like Firestore or OpenRouter) should be encapsulated in services within the `apps/api/src/services` directory. Routes in `apps/api/src/routes` should be lightweight controllers that delegate all real work to these services. This keeps the routes clean and makes the business logic easier to test and reuse.

### AI Interaction

- **Prompt Engineering:** Prompts are constructed in `packages/prompting`. When creating new prompts, ensure they explicitly instruct the AI to use the `[CITE:sourceId]` format and to ground all claims in the provided source material.
- **Source Grounding:** Before calling the AI to generate a draft, the `drafting-service.ts` retrieves relevant text chunks from user-provided sources. The AI is **only** fed these chunks as context. This is a core principle of the application.

### Authentication

The backend uses a middleware located at `apps/api/src/middleware/auth.ts` to protect routes. This middleware expects a Firebase ID token in the `Authorization: Bearer <token>` header. It verifies the token using the Firebase Admin SDK and attaches the decoded user information to the request object.

### Frontend State Management

The frontend uses a combination of React context for global state (like the current user) and component state for local UI state. For server state (data fetched from the API), we use TanStack Query (`@tanstack/react-query`) to handle caching, refetching, and optimistic updates. For complex, cross-component state, consider using a dedicated provider in `src/app/providers`.

## 2. Monorepo Architecture

This is a pnpm monorepo with several key packages:

- `apps/web`: The React/TypeScript frontend built with Vite and Chakra UI. This is the user-facing application.
- `apps/api`: The Node.js/Express backend that handles business logic, data persistence, and communication with external services.
- `packages/shared`: Contains shared code, primarily Zod schemas for type-safe data exchange between the frontend and backend.
- `packages/prompting`: Holds templates and builders for generating prompts sent to the AI models.
- `infra/firebase`: Configuration for Firebase services, including Firestore rules and indexes.

**Data Flow:**
1.  **Frontend (`apps/web`)** sends user requests to the backend.
2.  **Backend (`apps/api`)** processes requests, interacts with Firestore for data, and calls AI models via OpenRouter.
3.  **Shared Schemas (`packages/shared`)** ensure that data flowing between `web` and `api` is consistent and validated.

## 3. Core Technologies

- **Frontend:** React, TypeScript, Vite, Chakra UI, React Router.
- **Backend:** Node.js, Express, TypeScript.
- **Database:** Firebase Firestore is the primary database for storing user data, projects, sources, and drafts.
- **Authentication:** Firebase Authentication handles user sign-in.
- **AI Models:** AI capabilities are accessed through OpenRouter, primarily using `gemini/gemini-2.5-pro` for generation and `gemini/gemini-flash` for smaller tasks.
- **File Storage:** Firebase Storage is used for raw file uploads (e.g., PDFs of research papers).

## 4. Key Developer Workflows

### Running the Full Stack

1.  **Start Firebase Emulator:** To develop locally without affecting production data, use the Firestore emulator.
    ```bash
    cd infra/firebase
    firebase emulators:start --only firestore
    ```
2.  **Start the API:**
    ```bash
    # In a new terminal, from the root directory
    pnpm --filter @thesis-copilot/api dev
    ```
    The API requires environment variables for Firebase and OpenRouter. See `apps/api/README.md`.

3.  **Start the Web App:**
    ```bash
    # In another terminal, from the root directory
    pnpm --filter @thesis-copilot/web dev
    ```
    The web app also needs environment variables for Firebase. See `apps/web/README.md`.

### Testing

- **Run all tests:**
  ```bash
  pnpm test
  ```
- **Run integration tests:** These tests often require the Firebase emulator to be running.
  ```bash
  FIRESTORE_EMULATOR_HOST=localhost:8080 RUN_INTEGRATION_TESTS=true pnpm test:integration
  ```

## 5. Important Code Patterns & Conventions

### Shared Schemas (`packages/shared`)

To maintain type safety across the `api` and `web` apps, we use Zod schemas defined in `packages/shared/src/schemas`. When you add or modify a data structure that is sent between the frontend and backend, you **must** update the corresponding schema.

**Example:** When creating a new project, the frontend sends data that is validated against the `ProjectCreationSchema` from `packages/shared/src/schemas/project.ts`.

### API Services (`apps/api/src/services`)

All business logic and interaction with external services (like Firestore or OpenRouter) should be encapsulated in services within the `apps/api/src/services` directory. Routes in `apps/api/src/routes` should be lightweight and delegate all real work to these services.

### AI Interaction

- **Prompt Engineering:** Prompts are constructed in `packages/prompting`. When creating new prompts, ensure they explicitly instruct the AI to use the `[CITE:sourceId]` format.
- **Source Grounding:** Before calling the AI to generate a draft, the `drafting-service.ts` retrieves relevant text chunks from user-provided sources. The AI is only fed these chunks as context.

### Frontend State Management

The frontend uses a combination of React context and component state. For complex, cross-component state, consider using a dedicated provider in `src/app/providers`
