import type { Message, MessageDirection } from "@/types/message";

type ApiMessage = Message & {
  ID?: string;
  ConversationID?: string;
  Direction?: MessageDirection;
  Sender?: string;
  sender?: string;
  ReceivedAt?: string;
  CreatedAt?: string;
  received_at?: string;
  created_at?: string;
};

function readString(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

export function normalizeMessage(raw: ApiMessage): Message {
  return {
    id: readString(raw.id, raw.ID),
    conversation_id: readString(raw.conversation_id, raw.ConversationID),
    direction: raw.direction ?? raw.Direction ?? "inbound",
    content: raw.content ?? "",
    sender_phone: readString(raw.sender_phone, raw.sender, raw.Sender),
    sender_name: raw.sender_name ?? raw.sender ?? raw.Sender,
    sent_by: raw.sent_by,
    sent_at: readString(raw.sent_at, raw.received_at, raw.created_at, raw.ReceivedAt, raw.CreatedAt),
    wamid: raw.wamid,
  };
}
