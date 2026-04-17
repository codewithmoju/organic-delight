import { test, expect, Page } from '@playwright/test';

function uniqueEmail() {
  const ts = Date.now();
  return `e2e_${ts}@example.com`;
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
    errors.push(`console.error: ${text}`);
  });
}

test('full auth flow and protected routes smoke test', async ({ page }) => {
  test.setTimeout(300000);
  const runtimeErrors: string[] = [];
  await attachRuntimeErrorCapture(page, runtimeErrors);

  const email = uniqueEmail();
  const password = 'Test@12345';

  // 1) Multi-step registration
  await page.goto('/register-multi');
  await page.getByPlaceholder('e.g. John').fill('E2E');
  await page.getByPlaceholder('e.g. Doe').fill('Tester');
  await page.getByPlaceholder('john@example.com').fill(email);
  await page.locator('input[name="phone"]').fill('3001234567');
  await page.locator('input[type="date"]').fill('2000-01-01');
  await page.getByRole('button', { name: /Next Step/i }).click();

  // Step 2
  await page.getByPlaceholder('johndoe123').fill(`e2e_${Date.now().toString().slice(-6)}`);
  await page.locator('input[placeholder="••••••••"]').first().fill(password);
  await page.locator('input[placeholder="••••••••"]').nth(1).fill(password);
  await page.locator('select').first().selectOption({ index: 1 });
  await page.getByPlaceholder('Your secret answer').fill('Blue');
  await page.getByRole('button', { name: /Next Step/i }).click();

  // Step 3
  await page.getByPlaceholder('123 Business St').fill('Street 1');
  await page.getByPlaceholder('London').fill('Lahore');
  await page.getByPlaceholder('England').fill('Punjab');
  await page.getByPlaceholder('SW1A 1AA').fill('54000');
  await page.locator('input[type="checkbox"]').nth(0).check();
  await page.locator('input[type="checkbox"]').nth(1).check();
  await page.locator('input[type="checkbox"]').nth(2).check();
  await page.getByRole('button', { name: /Create Account/i }).click();

  await page.waitForURL(/\/login/, { timeout: 30000 });

  // 2) Login flow
  await page.getByPlaceholder('name@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/\/$/, { timeout: 30000 });

  // 3) Protected route smoke coverage
  const routes = [
    '/',
    '/pos',
    '/inventory/categories',
    '/inventory/items',
    '/inventory/alerts',
    '/vendors',
    '/purchases/new',
    '/customers',
    '/expenses',
    '/transactions',
    '/reports/performance',
    '/inventory/valuation',
    '/settings'
  ];

  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/\/login/);
  }

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});
