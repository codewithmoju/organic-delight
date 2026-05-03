import { test, expect } from '@playwright/test';

/**
 * E2E: Navigation and page loading
 * Tests that all major routes load without crashing.
 * Uses a shared authenticated state fixture.
 */

// Helper: attempt to authenticate or skip if no test credentials
async function tryLogin(page: any) {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    test.skip();
    return false;
  }
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL('/', { timeout: 15000 });
  return true;
}

test.describe('Navigation (requires TEST_EMAIL + TEST_PASSWORD env vars)', () => {
  test.beforeEach(async ({ page }) => {
    await tryLogin(page);
  });

  const routes = [
    { path: '/', name: 'Dashboard' },
    { path: '/inventory/items', name: 'Inventory Items' },
    { path: '/inventory/categories', name: 'Categories' },
    { path: '/inventory/alerts', name: 'Alerts' },
    { path: '/inventory/adjustments', name: 'Stock Adjustments' },
    { path: '/inventory/count', name: 'Inventory Count' },
    { path: '/inventory/expiry', name: 'Expiry Tracking' },
    { path: '/inventory/barcodes', name: 'Barcode Labels' },
    { path: '/purchases', name: 'Purchases' },
    { path: '/vendors', name: 'Vendors' },
    { path: '/customers', name: 'Customers' },
    { path: '/expenses', name: 'Expenses' },
    { path: '/transactions', name: 'Transactions' },
    { path: '/reports', name: 'Reports' },
    { path: '/settings', name: 'Settings' },
    { path: '/settings/audit', name: 'Audit Log' },
  ];

  for (const route of routes) {
    test(`${route.name} page loads without error`, async ({ page }) => {
      await page.goto(route.path);
      // Page should not show a crash/error boundary
      await expect(page.locator('body')).not.toContainText('Something went wrong');
      await expect(page.locator('body')).not.toContainText('Cannot read properties');
      // Should have some content
      await expect(page.locator('main, [role="main"], .space-y-4, .space-y-6').first()).toBeVisible({ timeout: 10000 });
    });
  }
});
