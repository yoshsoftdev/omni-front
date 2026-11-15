import { describe, expect, it } from "vitest";

import { runBulk } from "@/features/contacts/utils/bulk";

describe("runBulk", () => {
  it("runs every id, counts failures, and never exceeds the concurrency", async () => {
    let running = 0;
    let peak = 0;
    const result = await runBulk(["a", "b", "c", "d", "e"], async (id) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 1));
      running -= 1;
      if (id === "c") throw new Error("boom");
    }, 2);
    expect(result).toEqual({ ok: 4, failed: 1 });
    expect(peak).toBe(2);
  });
});
