import { defineConfig, devices } from "@playwright/test";

/**
 * Real-stack E2E: no mocks. Runs against a deployed stack (docker-compose.staging.yml),
 * e.g. `./deploy/deploy-staging.sh local` then `./deploy/e2e-staging.sh`.
 * The hermetic suite (playwright.config.ts, ./e2e) stays the CI gate.
 */
export default defineConfig({
  testDir: "./e2e-stack",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-stack" }]],
  outputDir: "test-results-stack",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:8095",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
