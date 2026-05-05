import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

const ROLE_LANDING: Record<string, string> = {
  cashier: '/pos',
  accountant: '/reports',
  // owner, manager, viewer → dashboard '/'
};

export function useRoleRedirect() {
  const navigate = useNavigate();
  const membership = useAuthStore((s) => s.membership);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized || !membership) return;

    const landing = ROLE_LANDING[membership.role];
    if (landing && window.location.pathname === '/') {
      navigate(landing, { replace: true });
    }
  }, [isInitialized, membership, navigate]);
}
