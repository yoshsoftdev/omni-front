export type ConversationStatus = "open" | "pending" | "resolved" | "closed";

export interface Conversation {
  id: string;
  contact_id: string;
  contact_name: string;
  customer_name?: string;
  contact_phone: string;
  contact_avatar_url?: string;
  provider_profile_id?: string;
  provider?: string;
  linked_providers?: string[];
  is_source_of_truth?: boolean;
  linked_account_count?: number;
  device_id: string;
  channel_type?: string;
  status: ConversationStatus;
  assigned_to?: string;
  assignee_name?: string;
  assignee_email?: string;
  last_message_at?: string;
  last_message_preview?: string;
  /** Last inbound customer message — used for Meta 24h free-text window. */
  last_customer_message_at?: string;
  unread_count: number;
  priority_score?: number;
  waiting_since?: string;
  created_at?: string;
  updated_at?: string;
}
