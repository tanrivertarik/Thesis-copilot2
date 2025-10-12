# Shared Packages

This workspace contains cross-cutting utilities shared by the web app and API.

## Planned Modules
- `types/`: TypeScript interfaces for core entities (projects, sources, drafts, telemetry).
- `utils/`: Reusable helpers (date formatting, token accounting, validation).
- `schemas/`: Zod/JSON schema definitions used for validation at the boundary layers.

## Next Steps
1. Decide on workspace tooling (`pnpm` or `npm` workspaces) and configure root `package.json`.
2. Add a starter `tsconfig.json` that can be aliased by `apps/*`.
