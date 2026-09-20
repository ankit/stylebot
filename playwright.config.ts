import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // Most assertions here poll for an async extension round trip (background
  // -> content script -> DOM); 5s is tight for that on a loaded CI worker.
  expect: { timeout: 10_000 },
  // CI runners are shared/resource-constrained enough that a test can flake for
  // reasons unrelated to the code under test — retry there, not locally.
  retries: process.env.CI ? 2 : 0,
  // fixtures.ts's browser pool now recovers a worker's Chrome dying, so more
  // workers no longer means a dead one takes a bigger chunk of the suite with it.
  workers: process.env.CI ? 4 : undefined,
  // Tests are isolated per-test (storage cleared, tabs closed) in fixtures.ts, so
  // Playwright can freely interleave them across workers instead of file-by-file.
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
});
