import { describe, expect, it } from "vitest";

import { parseKeywords } from "@/features/settings/types/auto-reply";

describe("parseKeywords", () => {
  it("splits on commas, trims and drops empties", () => {
    expect(parseKeywords(" harga, price list,, Jam buka ,")).toEqual(["harga", "price list", "Jam buka"]);
    expect(parseKeywords("  ")).toEqual([]);
  });
});
