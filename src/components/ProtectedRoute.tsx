import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { can } from '../lib/auth/permissions';
import type { Permission } from '../lib/types/org';
import AppLoader from './ui/AppLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const activeOrganization = useAuthStore((state) => state.activeOrganization);

  // Show full-screen loader while Firebase auth is initializing
  if (!isInitialized) {
    return <AppLoader fullScreen label="Authenticating your session…" />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If org scoping is active and permission is required, check it
  if (requiredPermission && activeOrganization && !can(requiredPermission)) {
    return <Navigate to="/" />;
  }

  return children;
}
