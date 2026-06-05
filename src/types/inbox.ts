export type InboxDirection = "inbound" | "outbound";

export interface InboxMessage {
  id: string;
  team_id: string;
  device_id?: string;
  wamid?: string;
  sender: string;
  recipient?: string;
  content: string;
  direction: InboxDirection;
  received_at: string;
}

export interface InboxEvent<TData = InboxMessage> {
  type: string;
  data: TData;
}

export interface SendInboxMessageInput {
  device_id: string;
  recipient: string;
  content: string;
}
