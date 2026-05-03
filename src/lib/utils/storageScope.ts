import type { StateStorage } from 'zustand/middleware';
import { auth } from '../firebase';
import { useAuthStore } from '../store';

function resolveUserId(explicitUserId?: string): string | null {
  if (explicitUserId) return explicitUserId;
  return auth.currentUser?.uid || useAuthStore.getState().user?.uid || useAuthStore.getState().profile?.id || null;
}

export function getScopedStorageKey(baseKey: string, explicitUserId?: string): string {
  const userId = resolveUserId(explicitUserId);
  return userId ? `${baseKey}:${userId}` : baseKey;
}

export function readScopedJSON<T>(baseKey: string, fallback: T, explicitUserId?: string, legacyKey?: string): T {
  try {
    const scopedKey = getScopedStorageKey(baseKey, explicitUserId);
    const scopedValue = localStorage.getItem(scopedKey);
    if (scopedValue) {
      return JSON.parse(scopedValue) as T;
    }

    const legacy = legacyKey ?? baseKey;
    const legacyValue = localStorage.getItem(legacy);
    if (legacyValue) {
      const uid = resolveUserId(explicitUserId);
      if (uid) {
        localStorage.setItem(scopedKey, legacyValue);
        localStorage.removeItem(legacy);
      }
      return JSON.parse(legacyValue) as T;
    }
  } catch (error) {
    console.error(`Failed to read scoped key: ${baseKey}`, error);
  }
  return fallback;
}

export function writeScopedJSON(baseKey: string, value: unknown, explicitUserId?: string): void {
  try {
    const uid = resolveUserId(explicitUserId);
    if (!uid) return;
    const scopedKey = getScopedStorageKey(baseKey, explicitUserId);
    localStorage.setItem(scopedKey, JSON.stringify(value));
    localStorage.removeItem(baseKey);
  } catch (error) {
    console.error(`Failed to write scoped key: ${baseKey}`, error);
  }
}

export function removeScopedKey(baseKey: string, explicitUserId?: string): void {
  localStorage.removeItem(getScopedStorageKey(baseKey, explicitUserId));
  localStorage.removeItem(baseKey);
}

/** Raw JSON string for callers that need a custom JSON.parse reviver (e.g. Date fields). */
export function readScopedRaw(baseKey: string, legacyKey?: string, explicitUserId?: string): string | null {
  try {
    const scopedKey = getScopedStorageKey(baseKey, explicitUserId);
    const scoped = localStorage.getItem(scopedKey);
    if (scoped !== null) return scoped;
    const legacy = legacyKey ?? baseKey;
    const legacyValue = localStorage.getItem(legacy);
    if (legacyValue !== null && resolveUserId(explicitUserId)) {
      localStorage.setItem(scopedKey, legacyValue);
      localStorage.removeItem(legacy);
    }
    return legacyValue;
  } catch {
    return null;
  }
}

/** Base keys used for tenant-scoped caches (suffix `:uid` in localStorage). */
export const TENANT_CACHE_BASE_KEYS: string[] = [
  'offline_pos_transactions',
  'pos_held_carts',
  'pos_current_shift',
  'pos_shift_history',
  'pos_settings_cache',
  'pos_bill_types_cache',
  'pos_quick_access_cache',
  'customers_cache',
  'vendors_cache',
  'expenses_cache',
  'inventory_items_cache',
  'inventory_categories_cache',
  'inventory_last_sync',
  'stock_last_sync_timestamp',
  'reports_monthly_cache',
  'reports_top_items_cache',
  'reports_category_dist_cache',
  'daily_report_cache',
  'daily_report_date_cache',
  'performance_cache',
  'valuation_cache',
  'dashboard_summary_cache',
  'dashboard_transactions_cache',
  'dashboard_metrics_cache',
  'auth-storage',
  'app-notifications',
  'app-locations',
  'customer_groups',
  'notification_preferences',
  'vendor_ratings',
  'stocksuite-accessibility-settings',
];

function dynamicTenantKeyNeedsPurge(key: string, previousUserId: string): boolean {
  const suf = `:${previousUserId}`;
  if (!key.endsWith(suf)) return false;
  return (
    key.startsWith('comm_log_') ||
    key.startsWith('loyalty_') ||
    key.startsWith('vendor_payment_schedule_')
  );
}

/**
 * Zustand persist adapter: read/write `name:uid` so stores do not bleed across accounts.
 */
export function createScopedZustandStorage(): StateStorage {
  return {
    getItem: (name) => {
      try {
        const scoped = getScopedStorageKey(name);
        const hit = localStorage.getItem(scoped);
        if (hit !== null) return hit;
        const legacy = localStorage.getItem(name);
        if (legacy !== null && resolveUserId()) {
          localStorage.setItem(scoped, legacy);
          localStorage.removeItem(name);
          return legacy;
        }
        return legacy;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      const uid = resolveUserId();
      if (!uid) return;
      const scoped = `${name}:${uid}`;
      localStorage.setItem(scoped, value);
      if (localStorage.getItem(name) !== null) localStorage.removeItem(name);
    },
    removeItem: (name) => {
      localStorage.removeItem(getScopedStorageKey(name));
      localStorage.removeItem(name);
    },
  };
}

/**
 * @param previousUserId — when switching accounts or logging out, drop this user's scoped blobs only.
 * Unscoped legacy keys (exact base name) are always removed to prevent bleed.
 */
export function clearKnownSessionStorage(previousUserId?: string | null): void {
  const globalKeys = ['pendingVerificationUid', 'pendingVerificationEmail'];
  globalKeys.forEach((key) => localStorage.removeItem(key));

  for (const base of TENANT_CACHE_BASE_KEYS) {
    localStorage.removeItem(base);
    if (previousUserId) {
      localStorage.removeItem(`${base}:${previousUserId}`);
    }
  }

  if (previousUserId) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (dynamicTenantKeyNeedsPurge(key, previousUserId)) {
        localStorage.removeItem(key);
      }
    }
  }
}
