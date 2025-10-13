import { execSync } from 'node:child_process';
import { randomUUID } from 'crypto';

export function requireEmulator() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST is not set. Start the Firestore emulator first.');
  }
}

export function resetFirestore(projectId: string) {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  try {
    execSync(
      `curl -s -X DELETE "http://${host}/emulator/v1/projects/${projectId}/databases/(default)/documents"`,
      { stdio: 'pipe' }
    );
  } catch (error) {
    // Ignore errors as the endpoint might not exist or be ready
    console.warn('Failed to clear Firestore data, continuing with test...');
  }
}

export async function setupFirebaseEmulator() {
  requireEmulator();
  
  // Initialize Firebase Admin SDK for testing
  if (!process.env.FIREBASE_PROJECT_ID) {
    process.env.FIREBASE_PROJECT_ID = 'thesis-copilot-test';
  }
  
  // Set up emulator environment
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}

export async function clearFirestoreData() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'thesis-copilot-test';
  resetFirestore(projectId);
}

export async function createTestUser(userId?: string): Promise<string> {
  const testUserId = userId || `test-user-${randomUUID()}`;
  // For emulator testing, we just return the user ID
  // In real implementation, you'd create the user in Firebase Auth emulator
  return testUserId;
}

export async function getTestIdToken(userId: string): Promise<string> {
  // For emulator testing, create a mock JWT token
  // In real implementation, you'd use Firebase Auth emulator to generate tokens
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    uid: userId,
    email: `${userId}@test.com`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  
  return `${header}.${payload}.`;
}
