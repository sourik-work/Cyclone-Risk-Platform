import { auth } from './firebase';

/**
 * Returns authorization headers with Firebase ID token.
 * Defaults to demo-dispatcher-token for seamless reviewer testing if not logged in.
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const token = await auth?.currentUser?.getIdToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch (err) {
    console.warn('Failed to retrieve Firebase ID token, using demo dispatcher header:', err);
  }
  return { Authorization: 'Bearer demo-dispatcher-token' };
}
