import type { InboxChatMessage } from "@/features/inbox/types";
import { mapMessageToInbox } from "@/features/inbox/mappers/inbox.mapper";
import type { Message } from "@/types/message";

function messageKey(message: Pick<InboxChatMessage, "id" | "client_message_id">) {
  return message.client_message_id ?? message.id;
}

function findMessageIndex(messages: InboxChatMessage[], target: {
  id?: string;
  client_message_id?: string;
  wamid?: string;
}) {
  const clientId = target.client_message_id?.trim();
  if (clientId) {
    const byClient = messages.findIndex(
      (message) => message.client_message_id === clientId || message.id === clientId,
    );
    if (byClient >= 0) return byClient;
  }
  if (target.id) {
    const byId = messages.findIndex((message) => message.id === target.id);
    if (byId >= 0) return byId;
  }
  if (target.wamid) {
    const byWamid = messages.findIndex((message) => message.wamid === target.wamid);
    if (byWamid >= 0) return byWamid;
  }
  return -1;
}

export function upsertOptimisticMessage(
  messages: InboxChatMessage[],
  optimistic: InboxChatMessage,
): InboxChatMessage[] {
  const index = findMessageIndex(messages, optimistic);
  if (index < 0) return [...messages, optimistic];
  const next = [...messages];
  next[index] = { ...next[index], ...optimistic };
  return next;
}

export function reconcileMessage(
  messages: InboxChatMessage[],
  serverMessage: InboxChatMessage,
): InboxChatMessage[] {
  const index = findMessageIndex(messages, serverMessage);
  if (index < 0) {
    if (messages.some((message) => message.id === serverMessage.id)) {
      return messages;
    }
    return [...messages, serverMessage];
  }
  const next = [...messages];
  next[index] = {
    ...next[index],
    ...serverMessage,
    client_message_id: serverMessage.client_message_id ?? next[index].client_message_id ?? messageKey(next[index]),
  };
  return next;
}

export function reconcileApiMessage(
  messages: InboxChatMessage[],
  raw: Message,
  agentName?: string,
): InboxChatMessage[] {
  return reconcileMessage(messages, mapMessageToInbox(raw, agentName));
}

export function markMessageSending(messages: InboxChatMessage[], clientMessageId: string): InboxChatMessage[] {
  return messages.map((message) =>
    messageKey(message) === clientMessageId
      ? { ...message, send_status: "sending", send_error: undefined }
      : message,
  );
}

export function markMessageFailed(
  messages: InboxChatMessage[],
  clientMessageId: string,
  error?: string,
): InboxChatMessage[] {
  return messages.map((message) =>
    messageKey(message) === clientMessageId
      ? { ...message, send_status: "failed", send_error: error }
      : message,
  );
}

export function applyMessageStatusUpdate(
  messages: InboxChatMessage[],
  payload: {
    message_id?: string;
    client_message_id?: string;
    status?: string;
  },
): InboxChatMessage[] {
  const index = findMessageIndex(messages, payload);
  if (index < 0) return messages;
  const status = payload.status;
  const next = [...messages];
  const current = { ...next[index] };
  if (status === "read") {
    current.send_status = "read";
    current.read = true;
    current.delivered = true;
  } else if (status === "delivered") {
    current.send_status = "delivered";
    current.delivered = true;
  } else if (status === "sent") {
    current.send_status = "sent";
  } else if (status === "failed") {
    current.send_status = "failed";
  }
  next[index] = current;
  return next;
}
