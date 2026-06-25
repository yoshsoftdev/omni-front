import type { Conversation, ConversationStatus } from "@/types/conversation";

type ApiConversation = Conversation & {
  ID?: string;
  ContactID?: string;
  ContactName?: string;
  ContactPhone?: string;
  ChannelID?: string;
  AssignedTo?: string;
  AssigneeName?: string;
  UnreadCount?: number;
  LastMessagePreview?: string;
  LastMessageAt?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  Status?: ConversationStatus;
};

function readString(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

export function normalizeConversation(raw: ApiConversation): Conversation {
  const id = readString(raw.id, raw.ID);
  const contactId = readString(raw.contact_id, raw.ContactID);
  const channelId = readString(raw.device_id, raw.ChannelID);

  return {
    id,
    contact_id: contactId,
    contact_name: readString(raw.contact_name, raw.ContactName),
    contact_phone: readString(raw.contact_phone, raw.ContactPhone),
    device_id: channelId,
    status: raw.status ?? raw.Status ?? "open",
    assigned_to: raw.assigned_to ?? raw.AssignedTo,
    assignee_name: raw.assignee_name ?? raw.AssigneeName,
    assignee_email: raw.assignee_email,
    last_message_at: raw.last_message_at ?? raw.LastMessageAt,
    last_message_preview: raw.last_message_preview ?? raw.LastMessagePreview,
    unread_count: raw.unread_count ?? raw.UnreadCount ?? 0,
    created_at: raw.created_at ?? raw.CreatedAt,
    updated_at: raw.updated_at ?? raw.UpdatedAt,
  };
}
