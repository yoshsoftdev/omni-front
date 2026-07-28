import { describe, expect, it } from "vitest";

import { isValidSlug, slugify, toApiParameterName } from "@/features/automation/utils/slug";

describe("slugify", () => {
  it("converts names to kebab-case", () => {
    expect(slugify("Send Invoice")).toBe("send-invoice");
    expect(slugify("  Payment Reminder!! ")).toBe("payment-reminder");
  });
});

describe("isValidSlug", () => {
  it("accepts kebab-case slugs", () => {
    expect(isValidSlug("send-invoice")).toBe(true);
    expect(isValidSlug("a")).toBe(false);
    expect(isValidSlug("Send Invoice")).toBe(false);
  });
});

describe("toApiParameterName", () => {
  it("maps numeric and named variables", () => {
    expect(toApiParameterName("1")).toBe("var1");
    expect(toApiParameterName("customer_name")).toBe("customerName");
    expect(toApiParameterName("{{due-date}}")).toBe("dueDate");
  });
});
