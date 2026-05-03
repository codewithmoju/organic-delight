# Tenant Strict Rollout

This project supports a controlled tenant isolation rollout through env flags.

## Flags

- `VITE_TENANT_ISOLATION_STRICT`
  - `false` (default): compat mode (legacy docs without `created_by` are temporarily allowed)
  - `true`: strict mode (missing/foreign ownership is rejected)
- `VITE_TENANT_ISOLATION_MONITOR_COMPAT`
  - `true` (default): emits one-time audit signals when compat fallback is used

## Commands

- `npm run tenant:strict:status` - show current `.env.local` flag values
- `npm run tenant:strict:checklist` - print rollout steps
- `npm run tenant:strict:enable` - set strict=true in `.env.local`
- `npm run tenant:strict:disable` - rollback switch (strict=false)

## Preflight

1. Run `npm run tenant:strict:status`
2. Check audit logs for tenant fallback signals:
   - `resource = tenant`
   - `details` contains `legacy ownership fallback used`
3. Confirm there are no new fallback events for active user flows
4. Run smoke checks across shared-browser sessions

## Enable

1. `npm run tenant:strict:enable`
2. `npm run build`
3. `npm test`
4. Deploy

## Rollback

If any legacy-data issues appear, immediately run:

- `npm run tenant:strict:disable`

Then rebuild/redeploy.
