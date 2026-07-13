import { describe, expect, it } from "vitest";

import {
  markMessageFailed,
  reconcileMessage,
  upsertOptimisticMessage,
} from "@/features/inbox/lib/message-reconcile";
import type { InboxChatMessage } from "@/features/inbox/types";

function msg(partial: Partial<InboxChatMessage> & { id: string }): InboxChatMessage {
  return {
    conversation_id: "c1",
    direction: "outbound",
    type: "text",
    content: "hello",
    sent_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

describe("message-reconcile", () => {
  it("reconciles optimistic row by client_message_id", () => {
    const optimistic = msg({
      id: "client-1",
      client_message_id: "client-1",
      send_status: "sending",
    });
    const merged = reconcileMessage([optimistic], msg({
      id: "server-1",
      client_message_id: "client-1",
      send_status: "sent",
    }));
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("server-1");
    expect(merged[0].client_message_id).toBe("client-1");
    expect(merged[0].send_status).toBe("sent");
  });

  it("does not duplicate when websocket echoes server id", () => {
    const existing = msg({ id: "server-1", client_message_id: "client-1", send_status: "sent" });
    const merged = reconcileMessage([existing], msg({ id: "server-1", client_message_id: "client-1" }));
    expect(merged).toHaveLength(1);
  });

  it("marks failed without removing content", () => {
    const optimistic = msg({ id: "client-1", client_message_id: "client-1", send_status: "sending" });
    const failed = markMessageFailed([optimistic], "client-1", "network");
    expect(failed[0].send_status).toBe("failed");
    expect(failed[0].content).toBe("hello");
    expect(failed[0].send_error).toBe("network");
  });

  it("upserts optimistic message in place", () => {
    const first = upsertOptimisticMessage([], msg({ id: "client-1", client_message_id: "client-1" }));
    const second = upsertOptimisticMessage(first, msg({ id: "client-1", client_message_id: "client-1", content: "updated" }));
    expect(second).toHaveLength(1);
    expect(second[0].content).toBe("updated");
  });
});
