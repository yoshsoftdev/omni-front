import { describe, expect, it } from "vitest";

import type { InboxConversation } from "@/features/inbox/types";
import { resolveAssigneeName, withResolvedAssignee } from "@/features/inbox/utils/resolve-assignee";

const AGENT_ID = "8f14e45f-ceea-467a-9c4a-6b3f4a1c2d3e";
const directory = new Map([[AGENT_ID, "Dita Agustin"]]);

function conv(partial: Partial<InboxConversation>): InboxConversation {
  return {
    id: "cv1",
    contact_id: "c1",
    contact_name: "Rory",
    contact_phone: "+62",
    channel: "whatsapp",
    status: "open",
    unread_count: 0,
    tags: [],
    ...partial,
  };
}

describe("resolveAssigneeName", () => {
  it("returns undefined when nobody is assigned", () => {
    expect(resolveAssigneeName(conv({}), directory)).toBeUndefined();
  });

  it("resolves the name from the member directory", () => {
    expect(resolveAssigneeName(conv({ assigned_to: AGENT_ID }), directory)).toBe("Dita Agustin");
  });

  it("keeps an existing human-readable name", () => {
    expect(
      resolveAssigneeName(conv({ assigned_to: AGENT_ID, assignee_name: "Automation Agent" }), directory),
    ).toBe("Automation Agent");
  });

  it("never shows a raw uuid as the assignee name", () => {
    expect(resolveAssigneeName(conv({ assigned_to: AGENT_ID, assignee_name: AGENT_ID }), directory)).toBe(
      "Dita Agustin",
    );
  });

  it("falls back when the agent is outside the directory", () => {
    expect(resolveAssigneeName(conv({ assigned_to: "unknown-id" }), directory)).toBe("Assigned agent");
  });
});

describe("withResolvedAssignee", () => {
  it("returns the same reference when nothing changes", () => {
    const source = conv({ assignee_name: "Dita Agustin", assigned_to: AGENT_ID });
    expect(withResolvedAssignee(source, directory)).toBe(source);
  });
});
