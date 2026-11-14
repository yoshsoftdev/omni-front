import fs from "node:fs";
import { expect, test } from "@playwright/test";

type Index = { entries: Record<string, { id: string; type: string }> };

// Story list comes from the built Storybook, so new stories are covered automatically.
const index = JSON.parse(fs.readFileSync("storybook-static/index.json", "utf8")) as Index;
const stories = Object.values(index.entries).filter((e) => e.type === "story");

for (const theme of ["light", "dark"] as const) {
  for (const story of stories) {
    test(`${story.id} (${theme})`, async ({ page }) => {
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
      await page.waitForSelector("#storybook-root > *", { state: "attached" });
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${story.id}--${theme}.png`, { fullPage: true });
    });
  }
}
