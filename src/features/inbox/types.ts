export type InboxTab = "open" | "assigned" | "unassigned" | "closed" | "all";

export type InboxConversationStatus = "open" | "assigned" | "unassigned" | "closed";

export type InboxChannel = "whatsapp" | "instagram" | "messenger" | "email";

export type AgentPresence = "online" | "away" | "offline";

export type InboxMessageType = "text" | "image" | "video" | "audio" | "document" | "template";

export type SubscriptionStatus = "subscribed" | "unsubscribed";

export interface InboxTag {
  id: string;
  name: string;
  color: string;
}

export interface InboxAgent {
  id: string;
  name: string;
  email: string;
  presence: AgentPresence;
}

export interface InboxContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  is_saved_contact?: boolean;
  subscription_status: SubscriptionStatus;
  source: string;
  added_on: string;
  last_activity: string;
  language: string;
  customer_type?: string;
  city?: string;
  notes?: string;
  tags: InboxTag[];
  conversations_count: number;
  campaigns_received: number;
  campaigns_clicked: number;
}

export interface InboxConversation {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  channel: InboxChannel;
  status: InboxConversationStatus;
  assigned_to?: string;
  assignee_name?: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count: number;
  tags: InboxTag[];
}

export interface InboxChatMessage {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  type: InboxMessageType;
  content: string;
  sent_at: string;
  wamid?: string;
  reply_to_wamid?: string;
  reply_to_message_id?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by_source?: "user_wa" | "agent_app" | "system";
  delivered?: boolean;
  read?: boolean;
  sender_name?: string;
  date_label?: string;
  attachment?: {
    storage_object_id: string;
    mime_type: string;
    size_bytes: number;
    filename: string;
  };
}

export interface InboxActivityEvent {
  id: string;
  type:
    | "opened"
    | "assigned"
    | "reassigned"
    | "closed"
    | "reopened"
    | "note_added"
    | "agent_replied"
    | "customer_replied"
    | "campaign_received"
    | "campaign_clicked"
    | "tag_added"
    | "tag_removed";
  description: string;
  created_at: string;
}

export interface InboxWorkspaceNote {
  id: string;
  category: "workspace" | "internal" | "supervisor";
  content: string;
  author: string;
  created_at: string;
}

export interface QuickReplyItem {
  id: string;
  category: string;
  text: string;
}
