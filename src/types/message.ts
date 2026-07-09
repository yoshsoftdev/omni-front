export interface MessageAttachment {
  storage_object_id: string;
  mime_type: string;
  size_bytes: number;
  filename: string;
}

export type MessageContentType = "text" | "image" | "video" | "audio" | "document" | "template" | "other";

export interface Message {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  content: string;
  content_type?: MessageContentType;
  attachment?: MessageAttachment;
  sender_phone: string;
  sender_name?: string;
  recipient_phone?: string;
  sent_by?: string;
  sent_at: string;
  wamid?: string;
  reply_to_wamid?: string;
  reply_to_message_id?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by_source?: "user_wa" | "agent_app" | "system";
}

export type MessageDirection = "inbound" | "outbound";

export interface SendMessageInput {
  content?: string;
  storage_object_id?: string;
  reply_to_wamid?: string;
}
