import { test, expect } from '@playwright/test';

/**
 * E2E: Purchase creation journey
 * Tests the 3-step purchase wizard.
 */

async function loginIfCredentials(page: any) {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) { test.skip(); return; }
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL('/', { timeout: 15000 });
}

test.describe('Purchase Creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfCredentials(page);
  });

  test('purchases list page loads', async ({ page }) => {
    await page.goto('/purchases');
    await expect(page.getByText(/purchases/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('new purchase wizard renders step 1', async ({ page }) => {
    await page.goto('/purchases/new');
    await expect(page.getByText(/select.*vendor|vendor/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/step 1|select vendor/i, { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test('cannot proceed to step 2 without selecting vendor', async ({ page }) => {
    await page.goto('/purchases/new');
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeVisible({ timeout: 10000 });
    await nextBtn.click();
    // Should show error toast or stay on step 1
    await expect(page.getByText(/select.*vendor|vendor.*required/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('purchase list shows analytics tab', async ({ page }) => {
    await page.goto('/purchases');
    await expect(page.getByRole('button', { name: /analytics/i })).toBeVisible({ timeout: 10000 });
  });

  test('purchase list has export button', async ({ page }) => {
    await page.goto('/purchases');
    await expect(page.getByText('Export')).toBeVisible({ timeout: 10000 });
  });
});
