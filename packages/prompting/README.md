# Prompting Toolkit

Prompt builders, templates, and post-processing logic for all AI features live in this workspace. Keeping prompts isolated ensures both the API and local evaluation harness can stay in sync.

## Planned Structure
- `templates/`: Base prompt templates and system messages.
- `builders/`: Type-safe builders that assemble prompts from runtime inputs.
- `validators/`: Response schema checks and normalizers.

## Next Steps
1. Define the shared prompt schema for the Thesis Constitution generator.
2. Add utility functions for token counting and cost tracking.
