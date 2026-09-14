import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  // Tests are isolated per-test (storage cleared, tabs closed) in fixtures.ts, so
  // Playwright can freely interleave them across workers instead of file-by-file.
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Browser launch + extension loading happens once per worker in e2e/fixtures.ts,
  // not per test — see the worker-scoped `context`/`extensionId` fixtures there.
});
