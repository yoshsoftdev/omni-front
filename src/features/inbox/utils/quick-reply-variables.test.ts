import { describe, expect, it } from "vitest";

import { formatQuickReplyToday, resolveQuickReplyVariables } from "@/features/inbox/utils/quick-reply-variables";

describe("resolveQuickReplyVariables", () => {
  it("replaces supported variables", () => {
    const result = resolveQuickReplyVariables(
      "Hi {{customer_name}}, this is {{agent_name}} from {{company_name}}. Call {{phone}} on {{today}}.",
      {
        customer_name: "Aulia",
        agent_name: "Budi",
        company_name: "Omni Corp",
        phone: "+62812",
        today: "July 20, 2026",
      },
    );
    expect(result).toBe("Hi Aulia, this is Budi from Omni Corp. Call +62812 on July 20, 2026.");
  });

  it("uses empty string for missing values", () => {
    expect(resolveQuickReplyVariables("Hello {{customer_name}}", {})).toBe("Hello ");
  });
});

describe("formatQuickReplyToday", () => {
  it("formats a stable locale date", () => {
    const formatted = formatQuickReplyToday(new Date("2026-07-20T10:00:00Z"));
    expect(formatted).toContain("2026");
  });
});
