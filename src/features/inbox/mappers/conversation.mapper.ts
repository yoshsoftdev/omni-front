import type { Conversation, ConversationStatus } from "@/types/conversation";

type ApiConversation = Conversation & {
  ID?: string;
  ContactID?: string;
  ContactName?: string;
  CustomerName?: string;
  ContactPhone?: string;
  ProviderProfileID?: string;
  Provider?: string;
  LinkedProviders?: string[];
  IsSourceOfTruth?: boolean;
  LinkedAccountCount?: number;
  ChannelID?: string;
  AssignedTo?: string;
  AssigneeName?: string;
  UnreadCount?: number;
  LastMessagePreview?: string;
  LastMessageAt?: string;
  LastCustomerMessageAt?: string;
  PriorityScore?: number;
  WaitingSince?: string;
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
    customer_name: readString(raw.customer_name, raw.CustomerName),
    contact_phone: readString(raw.contact_phone, raw.ContactPhone),
    contact_avatar_url: readString(
      raw.contact_avatar_url,
      (raw as { ContactAvatarURL?: string }).ContactAvatarURL,
    ) || undefined,
    provider_profile_id: raw.provider_profile_id ?? raw.ProviderProfileID,
    provider: readString(raw.provider, raw.Provider),
    linked_providers: raw.linked_providers ?? raw.LinkedProviders ?? [],
    is_source_of_truth: raw.is_source_of_truth ?? raw.IsSourceOfTruth ?? false,
    linked_account_count: raw.linked_account_count ?? raw.LinkedAccountCount ?? 0,
    device_id: channelId,
    channel_type: readString(raw.channel_type, (raw as { ChannelType?: string }).ChannelType) || undefined,
    status: raw.status ?? raw.Status ?? "open",
    assigned_to: raw.assigned_to ?? raw.AssignedTo,
    assignee_name: raw.assignee_name ?? raw.AssigneeName,
    assignee_email: raw.assignee_email,
    last_message_at: raw.last_message_at ?? raw.LastMessageAt,
    last_message_preview: raw.last_message_preview ?? raw.LastMessagePreview,
    last_customer_message_at: raw.last_customer_message_at ?? raw.LastCustomerMessageAt,
    unread_count: raw.unread_count ?? raw.UnreadCount ?? 0,
    priority_score: raw.priority_score ?? raw.PriorityScore ?? 0,
    waiting_since: raw.waiting_since ?? raw.WaitingSince,
    created_at: raw.created_at ?? raw.CreatedAt,
    updated_at: raw.updated_at ?? raw.UpdatedAt,
  };
}
