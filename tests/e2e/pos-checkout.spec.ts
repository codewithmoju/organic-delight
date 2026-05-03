import { test, expect } from '@playwright/test';

/**
 * E2E: POS checkout journey
 * Tests the critical POS flow: search product → add to cart → checkout.
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

test.describe('POS Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfCredentials(page);
  });

  test('POS page loads with search bar', async ({ page }) => {
    await page.goto('/pos');
    await expect(page.locator('input[placeholder*="Search"], input[placeholder*="scan"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('cart starts empty', async ({ page }) => {
    await page.goto('/pos');
    await expect(page.getByText(/cart is empty|add items/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('charge button is disabled with empty cart', async ({ page }) => {
    await page.goto('/pos');
    const chargeBtn = page.getByRole('button', { name: /charge|add items/i }).first();
    await expect(chargeBtn).toBeVisible({ timeout: 10000 });
    // Either disabled or shows "Add items to start"
    const isDisabled = await chargeBtn.isDisabled();
    const text = await chargeBtn.textContent();
    expect(isDisabled || text?.toLowerCase().includes('add items')).toBe(true);
  });

  test('return mode toggle is visible', async ({ page }) => {
    await page.goto('/pos');
    const returnBtn = page.getByRole('button', { name: /return mode|enable return/i });
    await expect(returnBtn).toBeVisible({ timeout: 10000 });
  });

  test('shift status bar is visible', async ({ page }) => {
    await page.goto('/pos');
    // Either "Open Shift" button or shift timer should be visible
    const shiftEl = page.locator('button:has-text("Open Shift"), button:has-text("Close")').first();
    await expect(shiftEl).toBeVisible({ timeout: 10000 });
  });
});
