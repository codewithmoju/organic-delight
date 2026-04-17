import { test, expect, type Browser, type Page } from '@playwright/test';

function uniqueEmail(prefix: string) {
  return `${prefix}_${Date.now()}@example.com`;
}

function uniqueCompanyName() {
  return `Tenant Guard ${Date.now().toString().slice(-6)}`;
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
    if (text.includes('Error checking username: FirebaseError: Missing or insufficient permissions.')) return;
    errors.push(`console.error: ${text}`);
  });
}

async function registerAndLogin(page: Page, email: string, password: string) {
  await page.goto('/register-multi');
  await page.getByPlaceholder('e.g. John').fill('E2E');
  await page.getByPlaceholder('e.g. Doe').fill('Isolation');
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

async function createVendor(page: Page, companyName: string) {
  await page.goto('/vendors');
  await page.getByRole('button', { name: /Add Vendor/i }).click();

  const directoryModal = page.locator('div.fixed.inset-0.z-50').last();
  await expect(directoryModal.getByText('Vendor Directory')).toBeVisible();
  await directoryModal.getByRole('button', { name: /^Add Vendor$/i }).click();

  await expect(page.getByPlaceholder('Contact Name *')).toBeVisible();

  await page.getByPlaceholder('Contact Name *').fill('Tenant Check');
  await page.getByPlaceholder('Company Name *').fill(companyName);
  await page.getByPlaceholder('Phone Number *').fill('03001234567');
  await page.getByRole('button', { name: /Save New Vendor/i }).click();

  await expect(page.getByText(companyName).first()).toBeVisible({ timeout: 30000 });
}

test('vendors stay isolated between two users', async ({ page, browser }) => {
  test.setTimeout(360000);

  const runtimeErrors: string[] = [];
  await attachRuntimeErrorCapture(page, runtimeErrors);

  const userOneEmail = uniqueEmail('tenant_a');
  const userTwoEmail = uniqueEmail('tenant_b');
  const password = 'Test@12345';
  const companyName = uniqueCompanyName();

  await registerAndLogin(page, userOneEmail, password);
  await createVendor(page, companyName);

  const secondBrowserContext = await browser.newContext();
  try {
    const secondPage = await secondBrowserContext.newPage();
    await attachRuntimeErrorCapture(secondPage, runtimeErrors);
    await registerAndLogin(secondPage, userTwoEmail, password);

    await secondPage.goto('/vendors');
    await secondPage.waitForLoadState('domcontentloaded');

    await expect(secondPage.getByText(companyName)).toHaveCount(0);
  } finally {
    await secondBrowserContext.close();
  }

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});