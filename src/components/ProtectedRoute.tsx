import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}