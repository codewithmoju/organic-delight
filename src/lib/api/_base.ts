import {
  collection,
  getDocs,
  query,
  where,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getOrgScopeFilter } from './orgScope';

// ── Timestamp Conversion ─────────────────────────────────────────────────────

/** Safely convert a Firestore Timestamp, Date, or string to a Date object. */
export function toDateSafe(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate();
  }
  return new Date(value as string | number);
}

/** Map common Firestore document fields to Date objects. */
export function mapTimestamps<T extends Record<string, any>>(
  data: T,
  fields: string[] = ['created_at', 'updated_at']
): T {
  const result = { ...data };
  for (const field of fields) {
    if (field in result) {
      (result as any)[field] = toDateSafe(result[field]);
    }
  }
  return result;
}

// ── Cache Factory ────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface ApiCache<T> {
  get(key: string): T | null;
  set(key: string, data: T): void;
  clear(): void;
  invalidate(key: string): void;
}

/** Create a simple in-memory cache with TTL. */
export function createCache<T>(ttlMs: number): ApiCache<T> {
  const store = new Map<string, CacheEntry<T>>();

  return {
    get(key: string): T | null {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() - entry.timestamp > ttlMs) {
        store.delete(key);
        return null;
      }
      return entry.data;
    },
    set(key: string, data: T): void {
      store.set(key, { data, timestamp: Date.now() });
    },
    clear(): void {
      store.clear();
    },
    invalidate(key: string): void {
      store.delete(key);
    },
  };
}

// ── Batch Fetch ──────────────────────────────────────────────────────────────

/** Fetch documents by ID in batches of 30 (Firestore 'in' limit). Uses org scope filter. */
export async function batchFetchByIds<T>(
  collectionName: string,
  ids: string[],
  mapDoc: (doc: QueryDocumentSnapshot | DocumentSnapshot) => T
): Promise<T[]> {
  if (ids.length === 0) return [];

  const results: T[] = [];
  const scope = getOrgScopeFilter();

  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    const snap = await getDocs(
      query(
        collection(db, collectionName),
        where(scope.field, '==', scope.value),
        where('__name__', 'in', chunk)
      )
    );
    snap.forEach((doc) => results.push(mapDoc(doc)));
  }

  return results;
}

// ── Pricing Resolution ───────────────────────────────────────────────────────

export interface ResolvedPricing {
  base_price: number;
  selling_price: number;
}

/** Resolve pricing from multiple possible field names (backward compatibility). */
export function resolvePricing(data: Record<string, any>): ResolvedPricing {
  const base_price = Number(
    data?.base_price ?? data?.purchase_rate ?? data?.average_unit_cost ?? 0
  ) || 0;
  const selling_price = Number(
    data?.selling_price ?? data?.unit_price ?? data?.sale_rate ?? 0
  ) || 0;
  return { base_price, selling_price };
}
