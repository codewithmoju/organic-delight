import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import { getInvite, acceptInvite } from '../../lib/api/invites';

type Status = 'loading' | 'success' | 'error' | 'not-logged-in';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const inviteId = searchParams.get('id');

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    if (!isInitialized) return;

    if (!inviteId) {
      setStatus('error');
      setMessage('No invite ID provided.');
      return;
    }

    if (!user) {
      setStatus('not-logged-in');
      return;
    }

    // Try to accept the invite
    (async () => {
      try {
        // First fetch invite to show org name
        const invite = await getInvite(inviteId);
        setOrgName(invite.organization_name || 'the organization');

        const orgId = await acceptInvite(inviteId);
        setStatus('success');
        setMessage(`You've joined ${invite.organization_name || 'the organization'}!`);

        // Redirect to dashboard after a short delay
        setTimeout(() => navigate('/'), 2500);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'Failed to accept invite.');
      }
    })();
  }, [inviteId, user, isInitialized, navigate]);

  if (!isInitialized) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center space-y-6"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
            <h1 className="text-xl font-bold text-foreground">Accepting invite...</h1>
            <p className="text-muted-foreground text-sm">Joining {orgName || 'organization'}...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome!</h1>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-error" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Invite Error</h1>
            <p className="text-muted-foreground">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary px-6 py-2.5 rounded-xl font-medium"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'not-logged-in' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Sign in required</h1>
            <p className="text-muted-foreground text-sm">
              You need to sign in or create an account to accept this invite.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(`/login?redirect=/accept-invite?id=${inviteId}`)}
                className="btn-primary px-6 py-2.5 rounded-xl font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate(`/register?redirect=/accept-invite?id=${inviteId}`)}
                className="btn-secondary px-6 py-2.5 rounded-xl font-medium"
              >
                Create Account
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
