import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUserId } from './userScope';
import { getOrgIdOrNull, getOrgScopeFilter } from './orgScope';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'create' | 'update' | 'delete' | 'login' | 'logout'
  | 'sale' | 'purchase' | 'payment' | 'adjustment' | 'return' | 'export'
  | 'security';

export type AuditResource =
  | 'item' | 'category' | 'customer' | 'vendor' | 'expense'
  | 'purchase' | 'pos_transaction' | 'user' | 'settings' | 'report'
  | 'tenant';

export interface AuditEntry {
  id: string;
  user_id: string;
  user_name?: string;
  action: AuditAction;
  resource: AuditResource;
  resource_id?: string;
  resource_name?: string;
  details?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Log an audit event. Fire-and-forget — never throws so it never
 * blocks the main operation.
 */
export async function logAudit(params: {
  action: AuditAction;
  resource: AuditResource;
  resource_id?: string;
  resource_name?: string;
  details?: string;
  metadata?: Record<string, any>;
  user_name?: string;
}): Promise<void> {
  try {
    const userId = getCurrentUserId();
    if (!userId) return;

    const orgId = getOrgIdOrNull();

    await addDoc(collection(db, 'audit_logs'), {
      user_id: userId,
      user_name: params.user_name || null,
      action: params.action,
      resource: params.resource,
      resource_id: params.resource_id || null,
      resource_name: params.resource_name || null,
      details: params.details || null,
      metadata: params.metadata || null,
      created_at: Timestamp.fromDate(new Date()),
      ...(orgId ? { organization_id: orgId } : {}),
    });
  } catch (err) {
    // Audit logging must never break the main flow
    console.warn('[AuditLog] Failed to write audit entry:', err);
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────

export interface AuditFilters {
  action?: AuditAction;
  resource?: AuditResource;
  limitCount?: number;
}

export async function getAuditLogs(filters: AuditFilters = {}): Promise<AuditEntry[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    const ref = collection(db, 'audit_logs');
    const scope = getOrgScopeFilter();
    let q = query(ref, where(scope.field, '==', scope.value), orderBy('created_at', 'desc'));

    if (filters.limitCount) {
      q = query(q, limit(filters.limitCount));
    }

    const snap = await getDocs(q);
    let entries = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      created_at: d.data().created_at?.toDate?.() || new Date(),
    })) as AuditEntry[];

    // Client-side filter for action/resource (avoids composite index requirement)
    if (filters.action) entries = entries.filter(e => e.action === filters.action);
    if (filters.resource) entries = entries.filter(e => e.resource === filters.resource);

    return entries;
  } catch (err) {
    console.error('[AuditLog] Failed to read audit logs:', err);
    return [];
  }
}
