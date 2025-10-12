import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../app/providers/firebase/app-instance';

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getAuth(firebaseApp);
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }
  return currentUser.getIdToken(forceRefresh);
}
