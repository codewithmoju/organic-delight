import { auth } from '../firebase';
import { useAuthStore } from '../store';

export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || useAuthStore.getState().profile?.id || null;
}

export function requireCurrentUserId(): string {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

export function isOwnedByCurrentUser(data: Record<string, any> | undefined): boolean {
  const userId = getCurrentUserId();
  if (!userId || !data) return false;
  return data.created_by === userId;
}
