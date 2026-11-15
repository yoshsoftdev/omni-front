import { describe, expect, it } from "vitest";

import { formatWindowRemaining } from "@/features/inbox/components/shared/conversation-meta-chips";

describe("formatWindowRemaining", () => {
  it("shows whole hours, then minutes in the last hour", () => {
    expect(formatWindowRemaining(23.9 * 3_600_000)).toBe("23h left");
    expect(formatWindowRemaining(3_600_000)).toBe("1h left");
    expect(formatWindowRemaining(59 * 60_000 + 1)).toBe("59m left");
    expect(formatWindowRemaining(10_000)).toBe("1m left");
  });
});
