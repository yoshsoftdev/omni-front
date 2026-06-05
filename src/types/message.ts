export type MessageDirection = "inbound" | "outbound";

export interface Message {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  content: string;
  sender_phone: string;
  sender_name?: string;
  sent_by?: string;
  sent_at: string;
  wamid?: string;
}
