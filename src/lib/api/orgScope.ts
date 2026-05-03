import { useAuthStore } from '../store';
import { requireCurrentUserId } from './userScope';

const ORG_SCOPING_ENABLED = import.meta.env.VITE_ORG_SCOPING_ENABLED === 'true';

/**
 * Returns the active organization ID, or null if org scoping is disabled
 * or no organization is set.
 */
export function getOrgIdOrNull(): string | null {
  if (!ORG_SCOPING_ENABLED) return null;
  return useAuthStore.getState().activeOrganization?.id ?? null;
}

/**
 * Returns the active organization ID, or throws if not available.
 * Use in write operations that require org context.
 */
export function requireCurrentOrgId(): string {
  const orgId = getOrgIdOrNull();
  if (!orgId) throw new Error('No active organization');
  return orgId;
}

/**
 * Stamps organization_id on a data object if org scoping is enabled.
 * Use in addDoc/updateDoc payloads.
 */
export function stampOrgId<T extends Record<string, any>>(data: T): T & { organization_id?: string } {
  const orgId = getOrgIdOrNull();
  if (!orgId) return data;
  return { ...data, organization_id: orgId };
}

/**
 * Strips undefined values from an object so Firestore doesn't reject them.
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/**
 * Returns the appropriate `where` clause for scoping queries.
 * - Org scoping ON: filters by `organization_id`
 * - Org scoping OFF: filters by `created_by` (legacy single-user behavior)
 *
 * Usage:
 *   const filter = getOrgScopeFilter();
 *   const q = query(collection(db, 'items'), where(filter.field, '==', filter.value));
 */
export function getOrgScopeFilter(): { field: string; value: string } {
  const orgId = getOrgIdOrNull();
  if (orgId) return { field: 'organization_id', value: orgId };
  return { field: 'created_by', value: requireCurrentUserId() };
}
