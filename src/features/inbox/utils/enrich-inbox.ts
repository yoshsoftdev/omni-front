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
): InboxConversation {
  const { name, phone } = resolveConversationContactLabel(incoming.contact_id, {
    name: incoming.contact_name,
    phone: incoming.contact_phone,
    fallbackName: contact?.name ?? existing?.contact_name,
    fallbackPhone: contact?.phone ?? existing?.contact_phone,
  });

  const mapped = mapConversationToInbox({
    ...incoming,
    contact_name: name,
    contact_phone: phone,
  });

  return {
    ...mapped,
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
    const { name: displayName, phone } = resolveConversationContactLabel(conversation.contact_id, {
      name: contact?.name ?? conversation.contact_name,
      phone: contact?.phone ?? conversation.contact_phone,
    });

    const enrichedConversation = mapConversationToInbox({
      ...conversation,
      contact_name: displayName,
      contact_phone: phone,
    });
    enrichedConversations.push(enrichedConversation);

    if (contact) {
      contactMap[contact.id] = mapContactToInboxContact(contact, !isUnsavedContact(contact));
    } else if (conversation.contact_id) {
      contactMap[conversation.contact_id] = {
        id: conversation.contact_id,
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
