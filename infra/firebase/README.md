# Firebase Emulator Development Setup

This directory contains the Firebase emulator configuration for local development of Thesis Copilot.

## Prerequisites

1. **Firebase CLI**: Install globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Node.js**: Version 18 or higher

## Quick Setup

### 1. Install Dependencies
```bash
cd infra/firebase
npm install
```

### 2. Start Emulators
```bash
# From the root of the project
npm run firebase:emulator

# Or from this directory
firebase emulators:start
```

### 3. Seed Development Data
In a new terminal:
```bash
# From the root of the project
npm run firebase:seed

# Or from this directory  
npm run seed
```

### 4. Access Emulator UI
- **Firebase UI**: http://localhost:4000
- **Firestore**: http://localhost:4000/firestore
- **Authentication**: http://localhost:4000/auth

## Environment Configuration

Copy the example environment file and configure for your setup:

```bash
cp .env.example .env.local
```

## Development Workflow

### Starting Full Development Environment
```bash
# From project root - starts emulator and both API/web servers
npm run dev:full
```

### Working with Seed Data

The emulator includes demo data:

**Demo Users:**
- `student@university.edu` / `Demo Student`  
- `researcher@university.edu` / `Demo Researcher`

**Demo Projects:**
- AI Impact on Education Technology (with full constitution)
- Sustainable Urban Development Patterns

**Demo Sources:**
- Research papers with summaries and embeddings
- Text sources with processed chunks

### Resetting Data
```bash
# Clear all emulator data
npm run firebase:reset

# Re-seed with demo data
npm run firebase:seed
```

## Testing Integration

### Running Tests Against Emulator
```bash
# From project root
FIRESTORE_EMULATOR_HOST=localhost:8080 RUN_INTEGRATION_TESTS=true pnpm test:integration
```

## Scripts Reference

```bash
# Start emulator suite
npm run firebase:emulator

# Seed development data  
npm run firebase:seed

# Reset emulator data
npm run firebase:reset

# Full development environment
npm run dev:full
```
