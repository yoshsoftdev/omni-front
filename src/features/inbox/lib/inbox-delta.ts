import type { InboxConversation } from "@/features/inbox/types";
import { mapConversationToInbox } from "@/features/inbox/mappers/inbox.mapper";
import { normalizeConversation } from "@/features/inbox/mappers/conversation.mapper";
import type { Conversation } from "@/types/conversation";

export interface ConversationDelta {
  conversation_id?: string;
  id?: string;
  last_message?: string;
  last_message_preview?: string;
  last_message_at?: string;
  priority_score?: number;
  waiting_since?: string;
  unread_count?: number;
  status?: string;
  assigned_to?: string;
  contact_id?: string;
  contact_name?: string;
  contact_phone?: string;
  channel_type?: string;
  provider?: string;
  provider_profile_id?: string;
  linked_providers?: string[];
  is_source_of_truth?: boolean;
  linked_account_count?: number;
}

function deltaId(delta: ConversationDelta): string {
  return (delta.conversation_id ?? delta.id ?? "").trim();
}

function mapStatus(status?: string): InboxConversation["status"] {
  if (!status) return "open";
  if (status === "closed" || status === "resolved") return "closed";
  if (status === "pending") return "unassigned";
  if (status === "assigned") return "assigned";
  return "open";
}

export function mergeDelta(
  existing: InboxConversation | undefined,
  delta: ConversationDelta,
): InboxConversation {
  const id = deltaId(delta);
  const base: InboxConversation = existing ?? {
    id,
    contact_id: delta.contact_id ?? "",
    contact_name: delta.contact_name ?? "",
    contact_phone: delta.contact_phone ?? "",
    channel: delta.provider ?? delta.channel_type ?? "unknown",
    status: "open",
    unread_count: 0,
    tags: [],
    priority_score: 0,
  };

  const contactName =
    !existing || !existing.contact_name?.trim()
      ? (delta.contact_name || base.contact_name)
      : base.contact_name;
  const contactPhone =
    !existing || !existing.contact_phone?.trim()
      ? (delta.contact_phone || base.contact_phone)
      : base.contact_phone;

  return {
    ...base,
    id: id || base.id,
    contact_id: delta.contact_id ?? base.contact_id,
    contact_name: contactName,
    contact_phone: contactPhone,
    channel: delta.provider ?? delta.channel_type ?? base.channel,
    provider_profile_id: delta.provider_profile_id ?? base.provider_profile_id,
    linked_providers: (delta.linked_providers as InboxConversation["linked_providers"]) ?? base.linked_providers,
    is_source_of_truth: delta.is_source_of_truth ?? base.is_source_of_truth,
    linked_account_count: delta.linked_account_count ?? base.linked_account_count,
    status: delta.status ? mapStatus(delta.status) : base.status,
    assigned_to: delta.assigned_to !== undefined ? delta.assigned_to : base.assigned_to,
    last_message_preview: delta.last_message ?? delta.last_message_preview ?? base.last_message_preview,
    last_message_at: delta.last_message_at ?? base.last_message_at,
    unread_count: delta.unread_count ?? base.unread_count,
    priority_score: delta.priority_score ?? base.priority_score,
    waiting_since: delta.waiting_since ?? base.waiting_since,
  };
}

export function mergeDeltas(deltas: ConversationDelta[]): Map<string, ConversationDelta> {
  const merged = new Map<string, ConversationDelta>();
  for (const delta of deltas) {
    const id = deltaId(delta);
    if (!id) continue;
    const prev = merged.get(id);
    merged.set(id, prev ? { ...prev, ...delta, conversation_id: id } : { ...delta, conversation_id: id });
  }
  return merged;
}

export function deltaToConversation(delta: ConversationDelta): InboxConversation {
  return mergeDelta(undefined, delta);
}

export function apiConversationToInbox(raw: Conversation): InboxConversation {
  return mapConversationToInbox(normalizeConversation(raw));
}
