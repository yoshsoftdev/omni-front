import { describe, expect, it } from "vitest";

import { isReady, whatsappReadiness } from "@/features/channels/utils/channel-readiness";

const healthy = {
  healthy: true,
  checks: { token: true, waba: true, phone: true, templates_api: true, template_sync: true },
};
const paid = { status: "configured" as const, message: "", has_primary_funding: true, business_verification_status: "verified" };

describe("whatsappReadiness", () => {
  it("is ready only when every check passes", () => {
    expect(isReady(whatsappReadiness({ channel: { status: "connected" }, payment: paid, health: healthy }))).toBe(true);
  });

  it("names the failing requirement and how to fix it", () => {
    const items = whatsappReadiness({
      channel: { status: "connected" },
      payment: { ...paid, status: "missing", message: "No funding source" },
      health: { ...healthy, healthy: false, checks: { ...healthy.checks, token: false } },
    });
    const failing = items.filter((i) => i.ok === false).map((i) => [i.key, i.hint]);
    expect(failing).toEqual([
      ["token", expect.stringContaining("expired")],
      ["payment", "No funding source"],
    ]);
  });

  it("reports unknown (not failed) while checks are loading, and is not ready", () => {
    const items = whatsappReadiness({ channel: { status: "connected" }, payment: null, health: null });
    expect(items.filter((i) => i.ok === null).map((i) => i.key)).toEqual(["token", "phone", "business", "payment", "templates"]);
    expect(isReady(items)).toBe(false);
  });
});
