import { apiClient } from "@/services/api/client";
import { normalizeMessage } from "@/features/inbox/mappers/message.mapper";
import type { Message, SendMessageInput } from "@/types/message";

type PageResponse<T> = {
  items?: T[];
  messages?: T[];
};

export const messageService = {
  async list(conversationId: string) {
    const response = await apiClient.get<PageResponse<Message>>(
      `/conversations/${conversationId}/messages?page_size=100`,
    );
    const rows = response.data?.items ?? response.data?.messages ?? [];
    return rows.map((row) => normalizeMessage(row));
  },

  async send(conversationId: string, input: SendMessageInput) {
    // #region agent log
    fetch("http://localhost:7465/ingest/6e3b7074-0a01-4186-8903-41796bcf051e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d8bb7a" },
      body: JSON.stringify({
        sessionId: "d8bb7a",
        runId: "run1",
        hypothesisId: "H5",
        location: "message.service.ts:send:request",
        message: "Send API request payload",
        data: {
          conversationId,
          hasReplyToWAMID: Boolean(input.reply_to_wamid),
          replyToWAMIDPrefix: input.reply_to_wamid ? input.reply_to_wamid.slice(0, 24) : null,
          hasStorageObject: Boolean(input.storage_object_id),
          contentLength: input.content?.length ?? 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const response = await apiClient.post<Message>(`/conversations/${conversationId}/messages`, {
      content: input.content ?? "",
      storage_object_id: input.storage_object_id,
      reply_to_wamid: input.reply_to_wamid,
    });
    // #region agent log
    fetch("http://localhost:7465/ingest/6e3b7074-0a01-4186-8903-41796bcf051e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d8bb7a" },
      body: JSON.stringify({
        sessionId: "d8bb7a",
        runId: "run1",
        hypothesisId: "H5",
        location: "message.service.ts:send:response",
        message: "Send API response",
        data: {
          conversationId,
          responseWAMID: response.data?.wamid ?? null,
          responseReplyToWAMID: (response.data as Message | undefined)?.reply_to_wamid ?? null,
          responseIsDeleted: Boolean((response.data as Message | undefined)?.is_deleted),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return normalizeMessage(response.data!);
  },

  async remove(conversationId: string, messageId: string) {
    // #region agent log
    fetch("http://localhost:7465/ingest/6e3b7074-0a01-4186-8903-41796bcf051e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d8bb7a" },
      body: JSON.stringify({
        sessionId: "d8bb7a",
        runId: "run1",
        hypothesisId: "H2",
        location: "message.service.ts:remove:request",
        message: "Delete API request",
        data: { conversationId, messageId },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const response = await apiClient.delete<Message>(`/conversations/${conversationId}/messages/${messageId}`);
    // #region agent log
    fetch("http://localhost:7465/ingest/6e3b7074-0a01-4186-8903-41796bcf051e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d8bb7a" },
      body: JSON.stringify({
        sessionId: "d8bb7a",
        runId: "run1",
        hypothesisId: "H2",
        location: "message.service.ts:remove:response",
        message: "Delete API response",
        data: {
          conversationId,
          messageId,
          responseIsDeleted: Boolean((response.data as Message | undefined)?.is_deleted),
          responseDeletedBySource: (response.data as Message | undefined)?.deleted_by_source ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return normalizeMessage(response.data!);
  },
};
