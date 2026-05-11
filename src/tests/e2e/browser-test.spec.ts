/**
 * ============================================================
 *  ORGANIC DELIGHT — Browser E2E Test Suite
 *  Runner  : Playwright (Chromium, headed / visible)
 *  Dev URL : http://localhost:5173
 *
 *  HOW TO RUN:
 *    npm run test:browser
 *
 *  ARCHITECTURE:
 *    global-setup.ts logs in ONCE and saves .auth/session.json
 *    All "authenticated" test groups reuse that saved session —
 *    the browser never types the password again after setup.
 *    Only the pure Auth UI tests use a fresh / logged-out page.
 * ============================================================
 */

import { test, expect, type Page } from '@playwright/test';
import { AUTH_FILE } from './global-setup';

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════

async function goToLogin(page: Page) {
  await page.goto('/login');
  await page.waitForSelector('#email', { state: 'visible' });
}

// ════════════════════════════════════════════════════════════
//  1. AUTHENTICATION UI MODULE
//     Fresh (logged-out) browser — tests the login page itself
// ════════════════════════════════════════════════════════════
test.describe('📦 Authentication Module', () => {
  // Each test in this group gets a clean, logged-out context
  test.use({ storageState: { cookies: [], origins: [] } });

  test('UC-AUTH-01 │ Login page loads with email & password fields', async ({ page }) => {
    await goToLogin(page);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('UC-AUTH-02 │ Empty submission keeps the user on /login', async ({ page }) => {
    await goToLogin(page);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/login/);
  });

  test('UC-AUTH-03 │ Wrong password → error message appears', async ({ page }) => {
    await goToLogin(page);
    await page.locator('#email').fill('codewithmoju@gmail.com');
    await page.locator('#password').fill('wrong_password_XYZ');
    await page.locator('button[type="submit"]').click();
    await expect(
      page.locator('text=/invalid|incorrect|wrong|credentials/i').first()
    ).toBeVisible({ timeout: 12_000 });
  });

  test('UC-AUTH-04 │ Forgot Password link navigates correctly', async ({ page }) => {
    await goToLogin(page);
    await page.locator('a[href="/forgot-password"]').click();
    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('UC-AUTH-05 │ Password eye-icon toggle shows / hides password', async ({ page }) => {
    await goToLogin(page);
    const pwInput = page.locator('#password');
    await pwInput.fill('secret123');
    await expect(pwInput).toHaveAttribute('type', 'password');
    await page.locator('button').filter({ has: page.locator('svg') }).last().click();
    await expect(pwInput).toHaveAttribute('type', 'text');
    await page.locator('button').filter({ has: page.locator('svg') }).last().click();
    await expect(pwInput).toHaveAttribute('type', 'password');
  });

  test('UC-AUTH-06 │ Unauthenticated "/" redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });

  test('UC-AUTH-07 │ Unknown route shows 404 page', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz');
    await expect(
      page.locator('text=/404|not found|page not found/i').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('UC-AUTH-08 │ Remember Me checkbox is present and clickable', async ({ page }) => {
    await goToLogin(page);
    const cb = page.locator('#remember-me');
    await expect(cb).toBeVisible();
    await cb.check();
    await expect(cb).toBeChecked();
    await cb.uncheck();
    await expect(cb).not.toBeChecked();
  });

  test('UC-AUTH-09 │ Login page loads under 4 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/login');
    await page.waitForSelector('#email', { state: 'visible' });
    expect(Date.now() - start).toBeLessThan(4_000);
  });

  test('UC-AUTH-10 │ Login page is responsive at 375 px (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await goToLogin(page);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

});

// ════════════════════════════════════════════════════════════
//  2. PAGE ROUTING MODULE  (authenticated — session reused)
// ════════════════════════════════════════════════════════════
test.describe('📦 Page Routing Module', () => {
  // Reuse the session saved by global-setup — no login needed
  test.use({ storageState: AUTH_FILE });

  test('UC-NAV-01 │ Dashboard (/) loads for logged-in user', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 15_000 });
  });

  test('UC-NAV-02 │ /inventory/items is accessible', async ({ page }) => {
    await page.goto('/inventory/items');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('UC-NAV-03 │ /customers is accessible', async ({ page }) => {
    await page.goto('/customers');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('UC-NAV-04 │ /vendors is accessible', async ({ page }) => {
    await page.goto('/vendors');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('UC-NAV-05 │ /reports is accessible', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('UC-NAV-06 │ /pos is accessible', async ({ page }) => {
    await page.goto('/pos');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('UC-NAV-07 │ /settings is accessible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('UC-NAV-08 │ /inventory/alerts is accessible', async ({ page }) => {
    await page.goto('/inventory/alerts');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('UC-NAV-09 │ /purchases is accessible', async ({ page }) => {
    await page.goto('/purchases');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('UC-NAV-10 │ /expenses is accessible', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

});

// ════════════════════════════════════════════════════════════
//  3. INVENTORY MODULE
// ════════════════════════════════════════════════════════════
test.describe('📦 Inventory Module', () => {
  test.use({ storageState: AUTH_FILE });

  test('UC-INV-01 │ Items page renders table or empty state', async ({ page }) => {
    await page.goto('/inventory/items');
    await page.waitForLoadState('networkidle').catch(() => {});
    const content = page.locator('table, [class*="empty"], h1, h2').first();
    await expect(content).toBeVisible({ timeout: 12_000 });
  });

  test('UC-INV-02 │ Items page has an Add / New button', async ({ page }) => {
    await page.goto('/inventory/items');
    await page.waitForLoadState('networkidle').catch(() => {});
    const btn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });

  test('UC-INV-03 │ Clicking Add opens a modal or form', async ({ page }) => {
    await page.goto('/inventory/items');
    await page.waitForLoadState('networkidle').catch(() => {});
    const btn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    await btn.click();
    await page.waitForTimeout(800);
    await expect(page.locator('dialog, [role="dialog"], form').first()).toBeVisible({ timeout: 8_000 });
  });

  test('UC-INV-04 │ Search bar accepts input', async ({ page }) => {
    await page.goto('/inventory/items');
    await page.waitForLoadState('networkidle').catch(() => {});
    const search = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await search.count() > 0) {
      await search.fill('milk');
      await expect(search).toHaveValue('milk');
    }
  });

  test('UC-INV-05 │ Low-Stock Alerts page renders', async ({ page }) => {
    await page.goto('/inventory/alerts');
    await page.waitForLoadState('networkidle').catch(() => {});
    const content = page.locator('h1, h2, table, [class*="empty"]').first();
    await expect(content).toBeVisible({ timeout: 12_000 });
  });

});

// ════════════════════════════════════════════════════════════
//  4. CUSTOMERS MODULE
// ════════════════════════════════════════════════════════════
test.describe('📦 Customer Module', () => {
  test.use({ storageState: AUTH_FILE });

  test('UC-CUS-01 │ Customers page renders content', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle').catch(() => {});
    const content = page.locator('h1, h2, table, [class*="empty"]').first();
    await expect(content).toBeVisible({ timeout: 12_000 });
  });

  test('UC-CUS-02 │ Customers page has an Add button', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle').catch(() => {});
    const btn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });

  test('UC-CUS-03 │ Clicking Add opens a customer form', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle').catch(() => {});
    const btn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    await btn.click();
    await page.waitForTimeout(800);
    await expect(page.locator('dialog, [role="dialog"], form').first()).toBeVisible({ timeout: 8_000 });
  });

  test('UC-CUS-04 │ Search field accepts input', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle').catch(() => {});
    const search = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await search.count() > 0) {
      await search.fill('Sara');
      await expect(search).toHaveValue('Sara');
    }
  });

});

// ════════════════════════════════════════════════════════════
//  5. VENDORS MODULE
// ════════════════════════════════════════════════════════════
test.describe('📦 Vendor Module', () => {
  test.use({ storageState: AUTH_FILE });

  test('UC-VEN-01 │ Vendors page renders content', async ({ page }) => {
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle').catch(() => {});
    const content = page.locator('h1, h2, table, [class*="empty"]').first();
    await expect(content).toBeVisible({ timeout: 12_000 });
  });

  test('UC-VEN-02 │ Vendors page has an Add button', async ({ page }) => {
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle').catch(() => {});
    const btn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });

  test('UC-VEN-03 │ Clicking Add opens a vendor form', async ({ page }) => {
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle').catch(() => {});
    const btn = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    await btn.click();
    await page.waitForTimeout(800);
    await expect(page.locator('dialog, [role="dialog"], form').first()).toBeVisible({ timeout: 8_000 });
  });

});

// ════════════════════════════════════════════════════════════
//  6. REPORTS MODULE
// ════════════════════════════════════════════════════════════
test.describe('📦 Reports Module', () => {
  test.use({ storageState: AUTH_FILE });

  test('UC-REP-01 │ Reports page renders content', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle').catch(() => {});
    const content = page.locator('h1, h2, [class*="report"], [class*="chart"], table').first();
    await expect(content).toBeVisible({ timeout: 12_000 });
  });

  test('UC-REP-02 │ Reports page does not crash', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('text=/something went wrong/i')).toHaveCount(0);
  });

});

// ════════════════════════════════════════════════════════════
//  7. POS MODULE
// ════════════════════════════════════════════════════════════
test.describe('📦 POS (Point of Sale) Module', () => {
  test.use({ storageState: AUTH_FILE });

  test('UC-POS-01 │ POS page renders content', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle').catch(() => {});
    const content = page.locator('h1, h2, button, input').first();
    await expect(content).toBeVisible({ timeout: 12_000 });
  });

  test('UC-POS-02 │ POS has a product search / input area', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 });
  });

  test('UC-POS-03 │ POS does not show an error boundary', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('text=/something went wrong/i')).toHaveCount(0);
  });

});

// ════════════════════════════════════════════════════════════
//  8. SETTINGS MODULE
// ════════════════════════════════════════════════════════════
test.describe('📦 Settings Module', () => {
  test.use({ storageState: AUTH_FILE });

  test('UC-SET-01 │ Settings page is accessible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).not.toHaveURL(/login/);
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('UC-SET-02 │ Settings page renders content', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle').catch(() => {});
    const content = page.locator('h1, h2, form, [class*="setting"]').first();
    await expect(content).toBeVisible({ timeout: 12_000 });
  });

});
