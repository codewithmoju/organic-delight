import { Building2, Settings } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import LoadingSpinner from './ui/LoadingSpinner';

const ORG_SCOPING_ENABLED = import.meta.env.VITE_ORG_SCOPING_ENABLED === 'true';

export default function OrgGuard({ children }: { children: React.ReactNode }) {
  const activeOrganization = useAuthStore((s) => s.activeOrganization);

  if (!ORG_SCOPING_ENABLED) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4 p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Organization Features</h2>
        <p className="text-muted-foreground text-sm">
          Multi-user organization features are not enabled. Add{' '}
          <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-xs font-mono">
            VITE_ORG_SCOPING_ENABLED=true
          </code>{' '}
          to your <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-xs font-mono">.env</code> file and restart the dev server.
        </p>
        <div className="text-xs text-muted-foreground space-y-1 pt-2">
          <p>After enabling, you also need to:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Deploy Firestore rules and indexes</li>
            <li>Run the backfill script (<code className="px-1 py-0.5 rounded bg-secondary text-xs font-mono">npm run backfill:org-id</code>)</li>
            <li>Deploy Cloud Functions for custom claims</li>
          </ol>
        </div>
      </div>
    );
  }

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading organization..." />
      </div>
    );
  }

  return <>{children}</>;
}
