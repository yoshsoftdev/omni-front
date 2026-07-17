import {
  isUnsavedContact,
  resolveContactDisplayName,
  resolveConversationContactLabel,
} from "@/features/contacts/utils/contact-identity";
import { mapContactToInboxContact, mapConversationToInbox } from "@/features/inbox/mappers/inbox.mapper";
import type { InboxContact, InboxConversation } from "@/features/inbox/types";
import type { Contact } from "@/types/contact";
import type { Conversation } from "@/types/conversation";

export function mergeRealtimeConversation(
  incoming: Conversation,
  existing?: InboxConversation,
  contact?: InboxContact,
  options?: { hasStatus?: boolean },
): InboxConversation {
  const { name, phone } = resolveConversationContactLabel(incoming.contact_id, {
    contact_name: incoming.contact_name,
    customer_name: contact?.customer_name,
    phone: incoming.contact_phone ?? contact?.phone,
    fallbackName: contact?.contact_name ?? contact?.name ?? existing?.contact_name,
    fallbackPhone: contact?.phone ?? existing?.contact_phone,
  });

  const mapped = mapConversationToInbox({
    ...incoming,
    contact_name: name,
    contact_phone: phone,
    contact_avatar_url: incoming.contact_avatar_url ?? contact?.avatar_url ?? existing?.contact_avatar_url,
  });

  const status = (() => {
    if (options?.hasStatus) return mapped.status;
    if (existing?.status === "closed") return "closed";
    return existing?.status ?? mapped.status;
  })();

  return {
    ...mapped,
    status,
    tags: existing?.tags ?? contact?.tags ?? mapped.tags,
  };
}

export function enrichInboxData(
  conversations: Conversation[],
  contacts: Contact[],
): { conversations: InboxConversation[]; contacts: Record<string, InboxContact> } {
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
  const contactMap: Record<string, InboxContact> = {};
  const enrichedConversations: InboxConversation[] = [];

  for (const conversation of conversations) {
    const contact = contactById.get(conversation.contact_id);
    const displayName = contact
      ? resolveContactDisplayName(contact)
      : resolveConversationContactLabel(conversation.contact_id, {
          contact_name: conversation.contact_name,
          customer_name: conversation.customer_name,
          phone: conversation.contact_phone,
        }).name;
    const phone = contact?.phone ?? conversation.contact_phone;

    const enrichedConversation = mapConversationToInbox({
      ...conversation,
      contact_name: displayName,
      contact_phone: phone,
      contact_avatar_url: conversation.contact_avatar_url ?? contact?.avatar_url,
    });
    enrichedConversations.push(enrichedConversation);

    if (contact) {
      contactMap[contact.id] = mapContactToInboxContact(contact, !isUnsavedContact(contact));
    } else if (conversation.contact_id) {
      contactMap[conversation.contact_id] = {
        id: conversation.contact_id,
        contact_name: displayName,
        customer_name: conversation.customer_name ?? displayName,
        name: displayName,
        phone,
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
  }

  return { conversations: enrichedConversations, contacts: contactMap };
}
