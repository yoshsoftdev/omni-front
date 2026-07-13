export type ConversationStatus = "open" | "pending" | "resolved" | "closed";

export interface Conversation {
  id: string;
  contact_id: string;
  contact_name: string;
  customer_name?: string;
  contact_phone: string;
  device_id: string;
  status: ConversationStatus;
  assigned_to?: string;
  assignee_name?: string;
  assignee_email?: string;
  last_message_at?: string;
  last_message_preview?: string;
  unread_count: number;
  priority_score?: number;
  waiting_since?: string;
  created_at?: string;
  updated_at?: string;
}
