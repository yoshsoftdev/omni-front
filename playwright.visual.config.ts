import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.VISUAL_PORT ?? 6107);

/**
 * Visual regression for the design system: every Storybook story is captured in
 * light and dark and compared with the committed baseline in visual/__screenshots__.
 * Run `pnpm build-storybook` first. Update baselines on purpose with `--update-snapshots`.
 * Baselines are rendered on Linux Chromium; other OSes render fonts differently.
 */
export default defineConfig({
  testDir: "./visual",
  testMatch: "**/*.visual.ts",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  fullyParallel: true,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  expect: { toHaveScreenshot: { maxDiffPixels: 0, animations: "disabled" } },
  use: { baseURL: `http://127.0.0.1:${PORT}`, ...devices["Desktop Chrome"], viewport: { width: 1024, height: 640 } },
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory storybook-static`,
    url: `http://127.0.0.1:${PORT}/index.json`,
    reuseExistingServer: !process.env.CI,
  },
});
