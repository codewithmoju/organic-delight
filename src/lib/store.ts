import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { auth as firebaseAuth } from './firebase';
import { signOut as firebaseSignOut, User } from 'firebase/auth';
import { Profile } from './types';
import { clearKnownSessionStorage, createScopedZustandStorage } from './utils/storageScope';
import { invalidateItemsCache } from './api/items';
import { clearTransactionsCache } from './api/transactions';
import { clearDashboardCache } from './api/dashboard';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => Promise<void>;
}

export function clearSessionCaches(previousUserId?: string | null): void {
  invalidateItemsCache();
  clearTransactionsCache();
  clearDashboardCache();
  clearKnownSessionStorage(previousUserId ?? undefined);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      signOut: async () => {
        const uid =
          firebaseAuth.currentUser?.uid ??
          useAuthStore.getState().user?.uid ??
          useAuthStore.getState().profile?.id ??
          null;
        await firebaseSignOut(firebaseAuth);
        clearSessionCaches(uid ?? undefined);
        set({ user: null, profile: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => createScopedZustandStorage()),
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

