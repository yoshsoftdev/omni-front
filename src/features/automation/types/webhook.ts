export type ForwardWebhookStatus = "active" | "disabled";

export type ForwardWebhookEvent = "message.received";

export interface ForwardWebhook {
  id: string;
  teamId: string;
  name: string;
  url: string;
  secret?: string;
  status: ForwardWebhookStatus;
  events: ForwardWebhookEvent[];
  channelId?: string | null;
  onlyUnassigned: boolean;
  assignAutomationOnReopen: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}

export interface CreateForwardWebhookInput {
  name: string;
  url: string;
  secret?: string;
  events?: ForwardWebhookEvent[];
  channelId?: string | null;
  onlyUnassigned?: boolean;
  assignAutomationOnReopen?: boolean;
}

export interface UpdateForwardWebhookInput {
  name?: string;
  url?: string;
  status?: ForwardWebhookStatus;
  events?: ForwardWebhookEvent[];
  channelId?: string | null;
  onlyUnassigned?: boolean;
  assignAutomationOnReopen?: boolean;
  clearChannel?: boolean;
  rotateSecret?: boolean;
  secret?: string;
}

export type ForwardDeliveryStatus = "success" | "failed";

export interface ForwardDelivery {
  id: string;
  teamId: string;
  webhookId: string;
  eventType: string;
  messageId?: string | null;
  conversationId?: string | null;
  status: ForwardDeliveryStatus;
  statusCode: number;
  errorMessage?: string | null;
  attemptedAt: string;
}

export interface InboxAutomationSettings {
  enabled: boolean;
  hasWebhook: boolean;
}
