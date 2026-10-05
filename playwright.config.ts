import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Read from dynamic environment file based on TEST_ENV, fallback to default .env
const testEnv = process.env.TEST_ENV || '';
const envFile = testEnv ? `.env.${testEnv}` : '.env';
dotenv.config({ path: path.resolve(__dirname, envFile) });

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Limit parallel tests locally to prevent overwhelming the QA server. */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['allure-playwright', { resultsDir: 'allure-results' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'https://qa.intranet.intuitiveapps.com/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /* ── Timeout settings ────────────────────────────────────────────────
     * actionTimeout:     max time for a single Playwright action (click, fill…)
     * navigationTimeout: max time for page.goto / waitForURL
     * timeout (below):  max time for an entire test — set per-test with
     *                   test.setTimeout() for unusually long flows.
     * ──────────────────────────────────────────────────────────────────── */
    actionTimeout: 20_000,      // 20 s — enough for slow dropdowns/modals
    navigationTimeout: 45_000,  // 45 s — API-heavy pages can be slow
  },

  /* Global per-test timeout (applies to every test unless overridden). */
  timeout: 120_000, // 2 min — covers joiner-creation + invoice-creation flows

  /* Default assertion (expect) timeout — how long expect() retries before failing. */
  expect: { timeout: 15_000 }, // 15 s — generous for table/toast assertions after API calls

  /* Configure projects for major browsers */
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: undefined,
      },
       dependencies: ['setup'],
    },
    // We can add Firefox and Webkit later as per requirements
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    //   dependencies: ['setup'],
    // },
  ],
});
