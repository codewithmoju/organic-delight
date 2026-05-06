import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { isSuperAdmin } from '../../lib/auth/permissions';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const isInitialized = useAuthStore((s) => s.isInitialized);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
