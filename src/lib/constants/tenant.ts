/**
 * Set VITE_TENANT_ISOLATION_STRICT=true in .env for production after legacy data is migrated.
 * In compat mode (default), documents without created_by are treated as owned by the current user.
 */
export const TENANT_ISOLATION_STRICT =
  import.meta.env.VITE_TENANT_ISOLATION_STRICT === 'true';

/**
 * Compat-mode observability: logs one-time audit signals when legacy docs (missing created_by)
 * are accessed while strict mode is still disabled.
 */
export const TENANT_ISOLATION_MONITOR_COMPAT =
  import.meta.env.VITE_TENANT_ISOLATION_MONITOR_COMPAT !== 'false';
