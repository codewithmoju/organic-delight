# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server (port 5173)
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Vitest (single run)
npm run test:watch       # Vitest (watch mode)
npm run test:coverage    # Vitest with v8 coverage
npm run test:e2e         # Playwright e2e (Edge, headless)
npx vitest run src/tests/unit/utils.test.ts           # Single test file
npx vitest run src/tests/unit/utils.test.ts --reporter verbose  # Verbose output
```

Coverage thresholds: 40% lines/functions/statements, 35% branches.

## Architecture

**Stack:** React 18 + TypeScript + Vite 5 + Tailwind CSS 3.4 + Firebase (Auth + Firestore) + Zustand 5 + React Router 6.

**No backend server.** All data flows client-side directly to Firestore via the Firebase SDK. No REST API, no Firebase Functions.

### Data Layer (`src/lib/`)

- **`firebase.ts`** — Firebase init via `VITE_FIREBASE_*` env vars. Firestore has persistent offline cache enabled.
- **`store.ts`** — Zustand auth store, persisted to localStorage, scoped per user.
- **`types.ts`** — All TypeScript interfaces (Item, Category, Transaction, Profile, etc.).
- **`api/`** — 24 modules, each exporting functions that call Firestore SDK directly. Every write/query enforces user scoping via `requireCurrentUserId()` / `assertOwnership()` from `userScope.ts`. POS uses `cashier_id` instead of `created_by`.
- **`hooks/`** — Custom hooks: useBarcodeScanner, usePOSCart, usePagination, usePreferences, useNotifications, useLocations, useLoyalty, useAccessibility, usePOSPermissions.
- **`utils/`** — Barcode, currency, validation, export (CSV/Excel/PDF), receipt/thermal-printer, SKU/billId generation, storageScope, dateFilters.
- **`constants/`** — Defaults, business types, tenant config.

### Routing (`src/App.tsx`)

All routes defined in App.tsx. Public: `/login`, `/register`, `/register-multi`, `/forgot-password`, `/verify-email`. Everything else wrapped in `<ProtectedRoute>` + `<Layout>` (sidebar shell). All page components lazy-loaded via `React.lazy()`.

### Tenant Isolation

Multi-tenant via `created_by` field on Firestore documents. Two modes:
- **Compat (default):** `VITE_TENANT_ISOLATION_STRICT=false` — legacy docs without `created_by` treated as owned.
- **Strict:** `VITE_TENANT_ISOLATION_STRICT=true` — rejects docs without matching `created_by`.

Rollout scripts: `npm run tenant:strict:status|enable|disable|checklist`.

### State Management

- **Zustand** for auth (`useAuthStore`), persisted to localStorage.
- **React Context** for theme (`ThemeContext`) and offline sync (`SyncContext`).
- **In-memory caches** in API modules (e.g., `itemsCache` Map with 2-min TTL in `src/lib/api/items.ts`). Cleared on sign-out via `clearSessionCaches()`.

### Offline / PWA

PWA via vite-plugin-pwa + Workbox. Firestore responses cached NetworkFirst (5 min). `SyncContext` manages localStorage-based POS transaction queue for offline operations.

### i18n

i18next with 11 languages (en, es, fr, de, it, pt, zh, ja, ar, hi, ur). RTL supported for Arabic/ Urdu. Locale files in `src/i18n/locales/`.

### Styling

Tailwind with `darkMode: 'class'`. CSS-variable-driven theme tokens (background, foreground, card, sidebar, primary, secondary, accent, success, warning, error, etc.). Custom breakpoints: xs (475px), 3xl (1600px).

### Testing

- **Unit/Component/Integration:** Vitest + jsdom. Setup at `src/tests/setup.ts` mocks Firebase, react-router, localStorage. Test files in `src/tests/{unit,component,integration}/`.
- **E2E:** Playwright targeting Edge headless at `http://127.0.0.1:4173`. Test dir: `tests/e2e/`.

### Component Organization

Feature-based: `components/{pos,inventory,vendors,customers,purchases,expenses,reports,dashboard,settings,tour}/`. Shared UI primitives in `components/ui/` (~30 components). Skeleton loaders per feature in `components/skeletons/`.

### Key Patterns

- Every API call must go through `src/lib/api/` modules, never direct Firestore imports in components.
- New API functions must enforce user scoping via `userScope.ts`.
- Use `src/lib/types.ts` for all interfaces — don't define types inline or in component files.
- Dark mode: use Tailwind `dark:` prefix. Theme tokens are CSS variables, not hardcoded colors.
- Notifications via Sonner (`toast` from `sonner`).
- Animations via Framer Motion.
- Date operations via date-fns (not native Date).

## Skills

Project-specific skills are available for common workflows. Use the `Skill` tool to invoke them.

| Skill | Trigger |
|-------|---------|
| `firestore-api-module` | Creating/modifying API modules in `src/lib/api/` |
| `stocksuite-component` | Building React components with Tailwind, theme tokens, i18n |
| `stocksuite-testing` | Writing Vitest tests (unit, component, integration) |
| `tenant-isolation` | Implementing or debugging multi-tenant data access |
| `pos-feature` | POS cart, payments, receipts, barcode scanning, offline queue |
| `i18n-integration` | Adding/modifying translations across 11 locale files |
| `stocksuite-review` | Code review checklist for this project |
| `stocksuite-feature-scaffold` | Scaffolding a new feature domain end-to-end |
| `stocksuite-debug` | Debugging Firestore errors, tenant bugs, POS issues |
