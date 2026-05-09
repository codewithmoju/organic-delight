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
  const orgResolved = useAuthStore((state) => state.orgResolved);
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin);

  // Auth still loading — show minimal spinner
  if (!isInitialized) {
    return <AppLoader fullScreen label="Authenticating your session…" />;
  }

  // Not logged in — redirect immediately
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Super admin bypasses all permission and org checks
  if (isSuperAdmin) {
    return children;
  }

  // If permission is required, enforce it
  if (requiredPermission) {
    // Wait for org resolution before making permission decisions
    if (!orgResolved) {
      return <AppLoader fullScreen label="Loading organization…" />;
    }
    if (!can(requiredPermission)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
