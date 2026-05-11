import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,

  // ── Run once before the entire suite to create the saved session ──
  globalSetup: './src/tests/e2e/global-setup.ts',

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',

    // Visible browser so you can watch
    headless: false,

    // Slow things down just enough to see what's happening
    launchOptions: { slowMo: 500 },

    viewport: { width: 1280, height: 800 },

    // Record a video of every run
    video: 'on',

    // Screenshot only on failure
    screenshot: 'only-on-failure',

    actionTimeout:     15_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
