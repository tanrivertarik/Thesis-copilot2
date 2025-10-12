# Testing

## Unit / Lint
- `pnpm lint`
- `pnpm --filter @thesis-copilot/api typecheck`
- `pnpm --filter @thesis-copilot/web typecheck`

## Integration (Firestore emulator)
1. Start the Firestore emulator:
   ```bash
   firebase --config infra/firebase/firebase.json emulators:start --only firestore
   ```
2. Export the emulator host and disable real OpenRouter calls:
   ```bash
   export FIRESTORE_EMULATOR_HOST=localhost:8080
   export RUN_INTEGRATION_TESTS=true
   ```
3. Ensure `.env` contains Firebase Admin credentials pointing to your project/emulator.
4. Run the integration suite:
   ```bash
   pnpm test:integration
   ```
   The suite is skipped by default unless `RUN_INTEGRATION_TESTS=true`.

Tests exercise the ingestion pipeline end-to-end (project creation → source ingestion → summarisation) using Firestore emulator data.
