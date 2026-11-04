import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true, timeout: process.env.PLAYWRIGHT_BASE_URL ? 60_000 : 30_000,
  expect: { timeout: 7_000 }, forbidOnly: !!process.env.CI, retries: 0,
  workers: process.env.CI ? 2 : 3, reporter: 'list',
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3107', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'pnpm start', url: 'http://localhost:3107', reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
