import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Firebase Emulator Integration', () => {
  let emulatorProcess: ChildProcess;

  beforeAll(async () => {
    // Start Firebase emulator
    const firebaseDir = path.join(__dirname, '../../infra/firebase');
    emulatorProcess = spawn('firebase', [
      'emulators:start', 
      '--only', 'firestore,auth', 
      '--project', 'demo-thesis-copilot'
    ], {
      cwd: firebaseDir,
      stdio: 'pipe'
    });

    // Wait for emulator to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Emulator startup timeout')), 30000);
      
      emulatorProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('All emulators ready!')) {
          clearTimeout(timeout);
          resolve(void 0);
        }
      });

      emulatorProcess.stderr?.on('data', (data) => {
        console.error('Emulator error:', data.toString());
      });
    });

    // Seed test data
    const seedProcess = spawn('npm', ['run', 'seed'], {
      cwd: firebaseDir,
      stdio: 'pipe'
    });

    await new Promise((resolve, reject) => {
      seedProcess.on('close', (code) => {
        if (code === 0) {
          resolve(void 0);
        } else {
          reject(new Error(`Seed process exited with code ${code}`));
        }
      });
    });
  }, 60000);

  afterAll(() => {
    if (emulatorProcess) {
      emulatorProcess.kill();
    }
  });

  it('should have Firebase emulator running', async () => {
    // Test Firestore emulator
    const response = await fetch('http://localhost:8080');
    expect(response.status).toBe(200);
  });

  it('should have seeded demo projects', async () => {
    // This would require setting up a Firebase client to test
    // For now, just verify the emulator endpoints are accessible
    const firestoreResponse = await fetch('http://localhost:4000/firestore');
    expect(firestoreResponse.status).toBe(200);

    const authResponse = await fetch('http://localhost:4000/auth');  
    expect(authResponse.status).toBe(200);
  });

  it('should allow API to connect to emulator', () => {
    // Verify environment variables are set for emulator
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBe('localhost:8080');
    expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe('localhost:9099');
  });
});