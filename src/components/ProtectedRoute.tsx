import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import AppLoader from './ui/AppLoader';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Show full-screen loader while Firebase auth is initializing
  if (!isInitialized) {
    return <AppLoader fullScreen label="Authenticating your session…" />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}
