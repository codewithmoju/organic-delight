import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth as firebaseAuth } from './firebase';
import { signOut as firebaseSignOut, User } from 'firebase/auth';
import { Profile } from './types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => Promise<void>;
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
        await firebaseSignOut(firebaseAuth);
        set({ user: null, profile: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

