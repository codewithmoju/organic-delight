/**
 * global-setup.ts
 * ─────────────────────────────────────────────────────────────
 * Runs ONCE before the entire test suite.
 * Logs in with real credentials → saves browser storage state
 * to .auth/session.json so every authenticated test can reuse
 * the session without logging in again.
 * ─────────────────────────────────────────────────────────────
 */

import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import fs   from 'fs';

export const AUTH_FILE = path.join(process.cwd(), '.auth', 'session.json');

export default async function globalSetup(_config: FullConfig) {
  // Ensure the .auth directory exists
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page    = await context.newPage();

  console.log('\n🔐  [Global Setup] Logging in once to save session…');

  await page.goto('http://localhost:5173/login');
  await page.waitForSelector('#email', { state: 'visible' });

  await page.locator('#email').fill('codewithmoju@gmail.com');
  await page.locator('#password').fill('Pwd4app.');
  await page.locator('button[type="submit"]').click();

  // Wait until redirected away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 25_000 });
  // Let Firebase finish org resolution
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

  // Save the full browser storage state (cookies + localStorage)
  await context.storageState({ path: AUTH_FILE });
  await browser.close();

  console.log('✅  [Global Setup] Session saved →', AUTH_FILE);
}
