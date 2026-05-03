/**
 * Strips undefined values from an object before writing to Firestore.
 * Firestore rejects `undefined` — use this before any addDoc / updateDoc call.
 *
 * Also handles nested objects one level deep.
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}

/**
 * Returns true if the given ID is a client-side optimistic placeholder
 * (i.e. not yet persisted to Firestore).
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp_');
}
