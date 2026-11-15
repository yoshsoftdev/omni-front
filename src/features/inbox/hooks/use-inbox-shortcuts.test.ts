import { describe, expect, it } from "vitest";

import { adjacentId } from "@/features/inbox/hooks/use-inbox-shortcuts";

describe("adjacentId", () => {
  const ids = ["a", "b", "c"];

  it("moves forward and back", () => {
    expect(adjacentId(ids, "b", 1)).toBe("c");
    expect(adjacentId(ids, "b", -1)).toBe("a");
  });

  it("stops at the ends", () => {
    expect(adjacentId(ids, "c", 1)).toBeNull();
    expect(adjacentId(ids, "a", -1)).toBeNull();
  });

  it("starts at the top when nothing (or a filtered-out id) is selected", () => {
    expect(adjacentId(ids, null, 1)).toBe("a");
    expect(adjacentId(ids, "gone", 1)).toBe("a");
    expect(adjacentId(ids, null, -1)).toBeNull();
    expect(adjacentId([], null, 1)).toBeNull();
  });
});
