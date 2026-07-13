import { resolveContactDisplayName } from "@/features/contacts/utils/contact-identity";
import type { Conversation, ConversationStatus } from "@/types/conversation";
import type { Message } from "@/types/message";
import type { Contact } from "@/types/contact";
import type {
  InboxChatMessage,
  InboxContact,
  InboxConversation,
  InboxConversationStatus,
  SubscriptionStatus,
} from "@/features/inbox/types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value?: string) {
  return Boolean(value && UUID_PATTERN.test(value));
}

function resolveOutboundSenderName(message: Message, agentName?: string) {
  if (message.direction !== "outbound") return undefined;
  const explicit = message.sender_name?.trim();
  if (explicit && !isUuid(explicit)) return explicit;
  const sender = message.sender_phone?.trim();
  if (sender && !isUuid(sender)) return sender;
  const fallback = agentName?.trim();
  if (fallback) return fallback;
  return undefined;
}

function resolveMessageSource(message: Message, agentName?: string): "agent_app" | "wa_business_app" | "unknown" {
  if (message.direction !== "outbound") return "unknown";
  const sender = message.sender_phone?.trim();
  if (sender && !isUuid(sender)) return "wa_business_app";
  const explicit = message.sender_name?.trim();
  if (explicit && !isUuid(explicit)) return "agent_app";
  const fallback = agentName?.trim();
  if (fallback) return "agent_app";
  return "unknown";
}

function mapConversationStatus(status: ConversationStatus): InboxConversationStatus {
  if (status === "resolved" || status === "closed") return "closed";
  if (status === "pending") return "unassigned";
  return "open";
}

export function mapConversationToInbox(conversation: Conversation): InboxConversation {
  return {
    id: conversation.id,
    contact_id: conversation.contact_id,
    contact_name: conversation.contact_name ?? "",
    contact_phone: conversation.contact_phone ?? "",
    channel: "whatsapp",
    status: mapConversationStatus(conversation.status),
    assigned_to: conversation.assigned_to,
    assignee_name: conversation.assignee_name,
    last_message_at: conversation.last_message_at,
    last_message_preview: conversation.last_message_preview,
    unread_count: conversation.unread_count,
    priority_score: conversation.priority_score ?? 0,
    waiting_since: conversation.waiting_since,
    tags: [],
  };
}

export function mapMessageToInbox(message: Message, agentName?: string): InboxChatMessage {
  const type = mapContentType(message.content_type, message.attachment?.mime_type);
  const source = resolveMessageSource(message, agentName);
  return {
    id: message.id,
    client_message_id: message.client_message_id,
    conversation_id: message.conversation_id,
    direction: message.direction,
    type,
    content: message.content,
    sent_at: message.sent_at,
    wamid: message.wamid,
    reply_to_wamid: message.reply_to_wamid,
    reply_to_message_id: message.reply_to_message_id,
    is_deleted: message.is_deleted,
    deleted_at: message.deleted_at,
    deleted_by_source: message.deleted_by_source,
    send_status: mapSendStatus(message.status),
    delivered: message.status === "delivered" || message.status === "read",
    read: message.status === "read",
    sender_name: resolveOutboundSenderName(message, agentName),
    sender_phone: message.sender_phone,
    recipient_phone: message.recipient_phone,
    source,
    attachment: message.attachment,
  };
}

function mapSendStatus(status?: Message["status"]) {
  if (!status) return undefined;
  return status;
}

function mapContentType(
  contentType?: Message["content_type"],
  mimeType?: string,
): InboxChatMessage["type"] {
  if (contentType === "image" || contentType === "video" || contentType === "audio" || contentType === "document" || contentType === "template") {
    return contentType;
  }
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
  if (mimeType?.startsWith("audio/")) return "audio";
  if (mimeType?.startsWith("application/")) return "document";
  return "text";
}

function mapConsentToSubscription(status?: string): SubscriptionStatus {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "opt_out" || normalized === "unsubscribed") return "unsubscribed";
  return "subscribed";
}

export function mapContactToInboxContact(contact: Contact, isSaved = true): InboxContact {
  const displayName = resolveContactDisplayName(contact);
  return {
    id: contact.id,
    contact_name: contact.contact_name,
    customer_name: contact.customer_name,
    name: displayName,
    phone: contact.phone,
    email: contact.email,
    is_saved_contact: isSaved,
    subscription_status: mapConsentToSubscription(contact.consent_status),
    source: contact.source,
    added_on: contact.created_at,
    last_activity: contact.last_activity_at ?? contact.updated_at,
    language: contact.language ?? "id",
    customer_type: contact.customer_type,
    city: contact.city,
    notes: contact.notes,
    tags: contact.tags,
    conversations_count: contact.conversations_count,
    campaigns_received: contact.campaigns_received ?? 0,
    campaigns_clicked: contact.campaigns_clicked ?? 0,
  };
}

export function mapConversationToInboxContact(conversation: Conversation): InboxContact {
  const displayName = conversation.contact_name;
  return {
    id: conversation.contact_id,
    contact_name: displayName,
    customer_name: displayName,
    name: displayName,
    phone: conversation.contact_phone,
    is_saved_contact: false,
    subscription_status: "subscribed",
    source: "whatsapp",
    added_on: conversation.created_at ?? new Date(0).toISOString(),
    last_activity: conversation.last_message_at ?? conversation.updated_at ?? new Date(0).toISOString(),
    language: "id",
    tags: [],
    conversations_count: 1,
    campaigns_received: 0,
    campaigns_clicked: 0,
  };
}
