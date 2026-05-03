import { auth } from '../firebase';
import { useAuthStore } from '../store';
import { TENANT_ISOLATION_MONITOR_COMPAT, TENANT_ISOLATION_STRICT } from '../constants/tenant';
import { logAudit } from './auditLog';

const legacyFallbackAuditSeen = new Set<string>();

function reportLegacyFallback(event: 'read-fallback' | 'write-fallback', resourceName: string, userId: string): void {
  if (!TENANT_ISOLATION_MONITOR_COMPAT || TENANT_ISOLATION_STRICT) return;
  const dedupeKey = `${event}:${resourceName}:${userId}`;
  if (legacyFallbackAuditSeen.has(dedupeKey)) return;
  legacyFallbackAuditSeen.add(dedupeKey);
  void logAudit({
    action: 'security',
    resource: 'tenant',
    details: `legacy ownership fallback used (${event})`,
    metadata: { resource: resourceName, user_id: userId },
  });
}

export function getCurrentUserId(): string | null {
  // Always prefer the live Firebase Auth UID — it's the source of truth
  return auth.currentUser?.uid || useAuthStore.getState().user?.uid || useAuthStore.getState().profile?.id || null;
}

export function requireCurrentUserId(): string {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

/**
 * Returns true if the document is owned by the current user.
 * - If the document has no created_by field (legacy data), treat as owned.
 * - Only returns false when created_by is explicitly set to a DIFFERENT user.
 */
export function isOwnedByCurrentUser(data: Record<string, any> | undefined): boolean {
  if (!data) return false;
  const userId = getCurrentUserId();
  if (!userId) return false;
  if (TENANT_ISOLATION_STRICT) {
    if (!data.created_by || data.created_by !== userId) return false;
    return true;
  }
  // Compat: legacy docs without created_by are treated as owned
  if (!data.created_by) {
    reportLegacyFallback('read-fallback', 'Record', userId);
    return true;
  }
  return data.created_by === userId;
}

/**
 * Throws if the document is not owned by the current user.
 * Use this in write operations instead of inline checks.
 */
export function assertOwnership(data: Record<string, any> | undefined, resourceName = 'Record'): void {
  if (!data) throw new Error(`${resourceName} not found`);
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');
  if (TENANT_ISOLATION_STRICT) {
    if (!data.created_by || data.created_by !== userId) {
      void logAudit({
        action: 'security',
        resource: 'tenant',
        details: `assertOwnership denied: ${resourceName}`,
        metadata: { expected_user: userId, doc_created_by: data.created_by ?? null },
      });
      throw new Error(`${resourceName} not found`);
    }
    return;
  }
  if (data.created_by && data.created_by !== userId) {
    void logAudit({
      action: 'security',
      resource: 'tenant',
      details: `assertOwnership denied (compat): ${resourceName}`,
      metadata: { expected_user: userId, doc_created_by: data.created_by },
    });
    throw new Error(`${resourceName} not found`);
  }
  if (!data.created_by) {
    reportLegacyFallback('write-fallback', resourceName, userId);
  }
}

/** POS transactions use cashier_id instead of created_by */
export function assertCashierOwnership(data: Record<string, any> | undefined, resourceName = 'Record'): void {
  if (!data) throw new Error(`${resourceName} not found`);
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');
  const owner = data.cashier_id ?? data.created_by;
  if (owner && owner !== userId) {
    throw new Error(`${resourceName} not found`);
  }
}
