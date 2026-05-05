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
  const orgResolved = useAuthStore((state) => state.orgResolved);

  // Show full-screen loader while Firebase auth is initializing
  if (!isInitialized) {
    return <AppLoader fullScreen label="Authenticating your session…" />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If permission is required, enforce it
  if (requiredPermission) {
    // Wait for org resolution before making permission decisions
    if (!orgResolved) {
      return <AppLoader fullScreen label="Loading organization…" />;
    }
    if (!activeOrganization) {
      return <AppLoader fullScreen label="No organization found" />;
    }
    if (!can(requiredPermission)) {
      return <Navigate to="/" />;
    }
  }

  return children;
}
