# Environment Configuration

Central location for environment variable templates and secrets management instructions.

## Files
- `local.example.env`: Developer template for web + API (`VITE_*` Firebase client config, API service keys).
- `ci.example.env`: CI variable map referencing secret manager keys (Firebase Admin, OpenRouter, etc.).

## Usage
1. Copy `local.example.env` to:
   - `apps/web/.env.local` (keep the `VITE_*` entries).
   - `apps/api/.env.local` (reuse the API section for admin/OpenRouter keys).
2. For CI, map the variables in your pipelines or secret store to match `ci.example.env`.
3. Update `VITE_API_BASE_URL` if the backend runs on a non-default host/port.
4. Optionally set `FIRESTORE_EMULATOR_HOST` (e.g. `localhost:8080`) when running Firebase emulators locally.

## Next Steps
1. Add Firestore emulator toggles and storage bucket overrides as implementation solidifies.
2. Integrate with a secrets manager (1Password, Doppler, Vault) before production.
