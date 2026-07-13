import { describe, expect, it } from "vitest";

import { inboxTabToParams } from "@/features/inbox/services/inbox.service";

describe("inboxTabToParams", () => {
  it("maps open tab to status=open and view=all", () => {
    const params = inboxTabToParams("open", {});
    expect(params.status).toBe("open");
    expect(params.view).toBe("all");
  });

  it("maps unassigned tab to unassigned view", () => {
    const params = inboxTabToParams("unassigned", {});
    expect(params.view).toBe("unassigned");
    expect(params.status).toBeUndefined();
  });

  it("keeps search isolated by params key", () => {
    const normal = inboxTabToParams("all", { search: "" });
    const search = inboxTabToParams("all", { search: "alice" });
    expect(normal.search).toBeUndefined();
    expect(search.search).toBe("alice");
  });
});
