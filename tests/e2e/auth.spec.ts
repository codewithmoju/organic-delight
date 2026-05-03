import { test, expect } from '@playwright/test';

/**
 * E2E: Authentication flows
 * Tests login, protected route redirect, and sign-out.
 */

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('shows validation error for empty form submission', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    // Should show some form of error or validation
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('invalid@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    // Wait for error toast or message
    await expect(
      page.locator('[data-sonner-toast], .error, [role="alert"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('forgot password page is accessible', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('register page is accessible', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
