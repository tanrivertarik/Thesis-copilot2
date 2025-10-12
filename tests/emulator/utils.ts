import { execSync } from 'node:child_process';

export function requireEmulator() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST is not set. Start the Firestore emulator first.');
  }
}

export function resetFirestore(projectId: string) {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  execSync(
    `curl -s -X DELETE "http://${host}/emulator/v1/projects/${projectId}/databases/(default)/documents"`,
    { stdio: 'ignore' }
  );
}
