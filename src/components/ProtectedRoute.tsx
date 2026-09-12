import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { can } from '../lib/auth/permissions';
import type { Permission } from '../lib/types/org';
import AppLoader from './ui/AppLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredModule?: string;
}

export default function ProtectedRoute({ children, requiredPermission, requiredModule }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const orgResolved = useAuthStore((state) => state.orgResolved);
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin);
  const profile = useAuthStore((state) => state.profile);

  // Auth still loading — show minimal spinner
  if (!isInitialized) {
    return <AppLoader fullScreen label="Authenticating your session…" />;
  }

  // Not logged in — redirect immediately
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle banned users
  if (profile?.status && profile.status !== 'active') {
    const isTemp = profile.status === 'banned_temporary';
    // If temp ban has expired, let them through (server-side would also allow this)
    if (isTemp && profile.ban_until && new Date(profile.ban_until) < new Date()) {
       // Let through
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card rounded-[2.5rem] p-8 border border-error/20 text-center shadow-xl">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Account Suspended</h1>
            <p className="text-muted-foreground mb-6">
              Your account has been {isTemp ? 'temporarily' : 'permanently'} suspended.
            </p>
            {profile.ban_reason && (
              <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
                <p className="text-sm text-foreground">{profile.ban_reason}</p>
                {isTemp && profile.ban_until && (
                  <p className="text-sm font-medium text-error mt-2">
                    Suspension lifts on: {new Date(profile.ban_until).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
            <button onClick={() => useAuthStore.getState().signOut()} className="btn-secondary w-full py-2.5">
              Sign Out
            </button>
          </div>
        </div>
      );
    }
  }

  // Super admin bypasses all permission and org checks
  if (isSuperAdmin) {
    return children;
  }

  // Check module access
  if (requiredModule) {
    const enabledModules = profile?.enabled_modules || ['pos', 'inventory', 'procurement', 'crm', 'expenses', 'reports'];
    if (!enabledModules.includes(requiredModule)) {
      return <Navigate to="/" replace />;
    }
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
