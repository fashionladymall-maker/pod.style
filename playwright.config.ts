import { defineConfig, devices } from '@playwright/test';

// Restrict Playwright to the dedicated integration suite and avoid pulling in unit tests
// under src/**/__tests__ (these are intended for Jest).
export default defineConfig({
  testDir: 'tests/integration',
  testMatch: /.*\.spec\.ts/, // keep default naming but scoped to integration folder
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    baseURL: process.env.FEED_E2E_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  // Optionally hook into a running Next.js dev server via FEED_E2E_BASE_URL; we avoid starting
  // one automatically because the sandbox blocks binding to ports.
});
