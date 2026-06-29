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

function mapConversationStatus(status: ConversationStatus): InboxConversationStatus {
  if (status === "resolved") return "closed";
  if (status === "pending") return "unassigned";
  return "open";
}

export function mapConversationToInbox(conversation: Conversation): InboxConversation {
  return {
    id: conversation.id,
    contact_id: conversation.contact_id,
    contact_name: conversation.contact_name,
    contact_phone: conversation.contact_phone,
    channel: "whatsapp",
    status: mapConversationStatus(conversation.status),
    assigned_to: conversation.assigned_to,
    assignee_name: conversation.assignee_name,
    last_message_at: conversation.last_message_at,
    last_message_preview: conversation.last_message_preview,
    unread_count: conversation.unread_count,
    tags: [],
  };
}

export function mapMessageToInbox(message: Message): InboxChatMessage {
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    direction: message.direction,
    type: "text",
    content: message.content,
    sent_at: message.sent_at,
    sender_name: message.sender_name ?? message.sender_phone,
  };
}

function mapConsentToSubscription(status?: string): SubscriptionStatus {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "opt_out" || normalized === "unsubscribed") return "unsubscribed";
  return "subscribed";
}

export function mapContactToInboxContact(contact: Contact, isSaved = true): InboxContact {
  return {
    id: contact.id,
    name: resolveContactDisplayName(contact),
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
  return {
    id: conversation.contact_id,
    name: conversation.contact_name,
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
