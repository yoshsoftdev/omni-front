import { describe, expect, it } from "vitest";

import {
  filterQuickReplies,
  findActiveSlashToken,
  replaceSlashToken,
} from "@/features/inbox/utils/quick-reply-slash";

describe("findActiveSlashToken", () => {
  it("detects slash token at start", () => {
    expect(findActiveSlashToken("/greet", 6)).toEqual({
      start: 0,
      end: 6,
      query: "greet",
    });
  });

  it("detects slash token after whitespace", () => {
    expect(findActiveSlashToken("hello /pay", 10)).toEqual({
      start: 6,
      end: 10,
      query: "pay",
    });
  });

  it("ignores slash inside words", () => {
    expect(findActiveSlashToken("email/name", 10)).toBeNull();
  });

  it("ignores completed words after slash", () => {
    expect(findActiveSlashToken("/greet thanks", 13)).toBeNull();
  });
});

describe("replaceSlashToken", () => {
  it("replaces slash command with resolved content", () => {
    const token = findActiveSlashToken("/greet", 6);
    expect(token).not.toBeNull();
    const { nextValue, nextCursor } = replaceSlashToken("/greet", token!, "Hello there");
    expect(nextValue).toBe("Hello there");
    expect(nextCursor).toBe("Hello there".length);
  });
});

describe("filterQuickReplies", () => {
  const items = [
    { id: "1", category: "Greeting", text: "Hello {{customer_name}}" },
    { id: "2", category: "Payment", text: "Please pay now" },
  ];

  it("filters by category and content", () => {
    expect(filterQuickReplies(items, "pay")).toHaveLength(1);
    expect(filterQuickReplies(items, "greet")).toHaveLength(1);
  });
});
