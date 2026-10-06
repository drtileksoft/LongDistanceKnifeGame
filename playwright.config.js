import { defineConfig } from '@playwright/test';

// Served under the same sub-path as on GitHub Pages to catch absolute paths.
const BASE = 'http://localhost:4173/LongDistanceKnifeGame/';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: BASE, trace: 'retain-on-failure', browserName: 'chromium' },
  webServer: {
    command: 'node tests/static-server.js',
    url: BASE,
    reuseExistingServer: !process.env.CI,
  },
});
