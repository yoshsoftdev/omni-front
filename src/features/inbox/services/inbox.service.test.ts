import { describe, expect, it } from "vitest";

import { inboxTabToParams } from "@/features/inbox/services/inbox.service";

describe("inboxTabToParams", () => {
  it("maps channel account id to channel_id, not channel_type", () => {
    const params = inboxTabToParams("open", { channelId: "ch_sales_1" });
    expect(params.channel_id).toBe("ch_sales_1");
    expect(params.channel_type).toBeUndefined();
  });

  it("omits channel_id for All Inbox", () => {
    const params = inboxTabToParams("open", { channelId: "all" });
    expect(params.channel_id).toBeUndefined();
    expect(params.channel_type).toBeUndefined();
  });

  it("keeps view/status for open tab", () => {
    const params = inboxTabToParams("open", { channelId: "all" });
    expect(params.status).toBe("open");
    expect(params.view).toBe("all");
  });
});
