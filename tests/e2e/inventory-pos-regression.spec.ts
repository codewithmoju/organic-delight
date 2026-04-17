import { test, expect, Page } from '@playwright/test';

function uniqueEmail() {
  const ts = Date.now();
  return `e2e_reg_${ts}@example.com`;
}

function uniqueValue(prefix: string) {
  return `${prefix}_${Date.now().toString().slice(-6)}`;
}

async function attachRuntimeErrorCapture(page: Page, errors: string[]) {
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`);
  });

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (text.includes('Failed to load resource')) return;
    if (text.includes('react-router-dom.js')) return;
    if (text.includes('inject.js')) return;
    if (text.includes('Error fetching discount types')) return;
    if (text.includes('Missing or insufficient permissions')) return;
    errors.push(`console.error: ${text}`);
  });
}

async function registerAndLogin(page: Page, email: string, password: string) {
  await page.goto('/register-multi');
  await page.getByPlaceholder('e.g. John').fill('E2E');
  await page.getByPlaceholder('e.g. Doe').fill('Regression');
  await page.getByPlaceholder('john@example.com').fill(email);
  await page.locator('input[name="phone"]').fill('3001234567');
  await page.locator('input[type="date"]').fill('2000-01-01');
  await page.getByRole('button', { name: /Next Step/i }).click();

  await page.getByPlaceholder('johndoe123').fill(`e2e_${Date.now().toString().slice(-6)}`);
  await page.locator('input[placeholder="••••••••"]').first().fill(password);
  await page.locator('input[placeholder="••••••••"]').nth(1).fill(password);
  await page.locator('select').first().selectOption({ index: 1 });
  await page.getByPlaceholder('Your secret answer').fill('Blue');
  await page.getByRole('button', { name: /Next Step/i }).click();

  await page.getByPlaceholder('123 Business St').fill('Street 1');
  await page.getByPlaceholder('London').fill('Lahore');
  await page.getByPlaceholder('England').fill('Punjab');
  await page.getByPlaceholder('SW1A 1AA').fill('54000');
  await page.locator('input[type="checkbox"]').nth(0).check();
  await page.locator('input[type="checkbox"]').nth(1).check();
  await page.locator('input[type="checkbox"]').nth(2).check();
  await page.getByRole('button', { name: /Create Account/i }).click();

  await page.waitForURL(/\/login/, { timeout: 30000 });

  await page.getByPlaceholder('name@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/\/$/, { timeout: 30000 });
}

test('inventory to POS to transactions regression', async ({ page }) => {
  test.setTimeout(360000);

  const runtimeErrors: string[] = [];
  await attachRuntimeErrorCapture(page, runtimeErrors);

  const email = uniqueEmail();
  const password = 'Test@12345';
  const probe = uniqueValue('E2EProbe');

  await registerAndLogin(page, email, password);

  // 1) Pick an existing inventory item name
  await page.goto('/inventory/items');
  const inventoryItemName = (await page.locator('[data-tour="items-grid"] h3').first().textContent())?.trim() || probe;

  // 2) Sell that item in POS via product search
  await page.goto('/pos');
  const posSearch = page.getByPlaceholder('Search products or scan barcode...');
  await posSearch.fill(inventoryItemName);
  const searchResultTitle = page.locator('h4', { hasText: inventoryItemName }).first();
  await expect(searchResultTitle).toBeVisible({ timeout: 30000 });
  await searchResultTitle.click();

  const chargeButton = page.getByRole('button', { name: /Charge/i });
  await expect(chargeButton).toBeEnabled({ timeout: 20000 });
  await page.getByRole('button', { name: /Charge/i }).click();
  await page.getByRole('button', { name: /Pay/i }).click();

  await expect(page.getByText(/Cart is empty/i)).toBeVisible({ timeout: 30000 });

  // 3) Validate sale appears in transactions (eventual consistency-safe)
  await expect(async () => {
    await page.goto('/transactions?tab=sales');
    const search = page.getByPlaceholder('Search activity...');
    await search.fill(inventoryItemName);
    await expect(page.getByText(inventoryItemName).first()).toBeVisible();
  }).toPass({ timeout: 90000, intervals: [2000, 4000, 7000] });

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});
