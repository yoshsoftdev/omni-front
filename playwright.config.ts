import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * E2E tests run the real Next.js app against a mocked backend:
 * every browser call to /api/v1/** is intercepted in the test (see e2e/fixtures),
 * so the suite is hermetic and also locks the frontend → API contract.
 *
 * Files are named *.e2e.ts so Vitest (which picks up *.test/*.spec) never runs them.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm exec next dev -p ${PORT} -H 127.0.0.1`,
        url: `${BASE_URL}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          NEXT_PUBLIC_API_URL: "/api/v1",
          // Never reach a real backend from e2e; unmocked calls fail fast.
          BACKEND_URL: "http://127.0.0.1:9",
          NEXT_TELEMETRY_DISABLED: "1",
        },
      },
});
