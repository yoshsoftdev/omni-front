"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ComposerSendInput } from "@/features/inbox/components/message-composer";
import type { ConversationDelta } from "@/features/inbox/lib/inbox-delta";
import {
  applyMessageStatusUpdate,
  markMessageFailed,
  markMessageSending,
  reconcileApiMessage,
  upsertOptimisticMessage,
} from "@/features/inbox/lib/message-reconcile";
import { mapMessageToInbox } from "@/features/inbox/mappers/inbox.mapper";
import { contentTypeFromMime } from "@/features/inbox/mappers/message.mapper";
import { conversationService } from "@/features/inbox/services/conversation.service";
import { messageService } from "@/features/inbox/services/message.service";
import type {
  InboxActivityEvent,
  InboxChatMessage,
  InboxWorkspaceNote,
} from "@/features/inbox/types";
import { applyMessageDateLabels } from "@/features/inbox/utils/message-date";
import { generateUUID } from "@/lib/uuid";
import { formatApiErrorMessage } from "@/services/api/errors";
import { websocketClient } from "@/services/websocket/client";
import type { Message } from "@/types/message";

type Notify = (type: "success" | "error", message: string) => void;
type StatusPayload = Parameters<typeof applyMessageStatusUpdate>[1] & { conversation_id?: string };

function toMillis(value?: string): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function ordered(messages: InboxChatMessage[]) {
  return applyMessageDateLabels([...messages].sort((a, b) => toMillis(a.sent_at) - toMillis(b.sent_at)));
}

function optimisticAttachmentPreview(input: ComposerSendInput): string {
  if (input.content.trim()) return input.content.trim();
  const mimeType = input.attachment?.mime_type ?? "";
  const type = mimeType ? contentTypeFromMime(mimeType) : "text";
  switch (type) {
    case "audio":
      return "Voice note";
    case "image":
      return "Photo";
    case "video":
      return "Video";
    case "document":
      return input.attachment?.filename || "Document";
    default:
      return "Media";
  }
}

function prependUnique<T extends { id: string }>(list: T[] | undefined, item: T): T[] {
  const existing = list ?? [];
  return existing.some((x) => x.id === item.id) ? existing : [item, ...existing];
}

/**
 * Messages, activities and notes of the open conversation, plus the actions that change them.
 * State is kept per conversation so switching back is instant; realtime events for any
 * conversation are folded in through the `apply*` functions.
 */
export function useConversationThread({
  selectedId,
  agentName,
  notify,
  applyListDelta,
}: {
  selectedId: string | null;
  agentName: string;
  notify: Notify;
  applyListDelta: (delta: ConversationDelta) => void;
}) {
  const [messagesById, setMessagesById] = useState<Record<string, InboxChatMessage[]>>({});
  const [activitiesById, setActivitiesById] = useState<Record<string, InboxActivityEvent[]>>({});
  const [notesById, setNotesById] = useState<Record<string, InboxWorkspaceNote[]>>({});
  const [loadErrorById, setLoadErrorById] = useState<Record<string, string | null>>({});
  // Bumped on every socket open (D9) or a manual retry, to reload the open thread.
  const [reloadTick, setReloadTick] = useState(0);
  useEffect(() => websocketClient.onConnected(() => setReloadTick((n) => n + 1)), []);
  const pendingRef = useRef<Record<string, { conversationId: string; input: ComposerSendInput }>>({});

  const updateMessages = useCallback(
    (conversationId: string, fn: (prev: InboxChatMessage[]) => InboxChatMessage[]) =>
      setMessagesById((prev) => ({ ...prev, [conversationId]: ordered(fn(prev[conversationId] ?? [])) })),
    [],
  );

  const toInboxMessage = useCallback((message: Message) => mapMessageToInbox(message, agentName), [agentName]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    messageService
      .list(selectedId)
      .then((messages) => {
        if (cancelled) return;
        setMessagesById((prev) => ({ ...prev, [selectedId]: ordered(messages.map(toInboxMessage)) }));
        setLoadErrorById((prev) => ({ ...prev, [selectedId]: null }));
      })
      .catch((err) => {
        if (!cancelled) setLoadErrorById((prev) => ({ ...prev, [selectedId]: formatApiErrorMessage(err) }));
      });
    // Activities and notes are secondary: a failure here leaves them empty, never blocks the thread.
    Promise.all([conversationService.listActivities(selectedId), conversationService.listNotes(selectedId)])
      .then(([activities, notes]) => {
        if (cancelled) return;
        setActivitiesById((prev) => ({ ...prev, [selectedId]: activities }));
        setNotesById((prev) => ({ ...prev, [selectedId]: notes }));
      })
      .catch(() => {
        if (cancelled) return;
        setActivitiesById((prev) => ({ ...prev, [selectedId]: [] }));
        setNotesById((prev) => ({ ...prev, [selectedId]: [] }));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, toInboxMessage, reloadTick]);

  const dispatchSend = useCallback(
    async (conversationId: string, clientMessageId: string, input: ComposerSendInput) => {
      try {
        const sent = await messageService.send(conversationId, {
          content: input.content,
          storage_object_id: input.storageObjectId,
          reply_to_message_id: input.replyToMessageId,
          client_message_id: clientMessageId,
        });
        updateMessages(conversationId, (prev) => reconcileApiMessage(prev, sent, agentName));
        if (sent.delivery_notice) notify("success", sent.delivery_notice);
        delete pendingRef.current[clientMessageId];
      } catch (error) {
        console.error("[Inbox] Send message failed", {
          conversationId,
          error: formatApiErrorMessage(error),
          raw: error,
        });
        updateMessages(conversationId, (prev) =>
          markMessageFailed(prev, clientMessageId, formatApiErrorMessage(error)),
        );
      }
    },
    [agentName, notify, updateMessages],
  );

  const send = useCallback(
    (input: ComposerSendInput) => {
      if (!selectedId) return;
      const clientMessageId = generateUUID();
      const messageType = input.attachment ? contentTypeFromMime(input.attachment.mime_type) : "text";
      const preview = optimisticAttachmentPreview(input);
      const optimistic: InboxChatMessage = {
        id: clientMessageId,
        client_message_id: clientMessageId,
        conversation_id: selectedId,
        direction: "outbound",
        type: messageType,
        content: input.content || (messageType === "audio" ? "Voice note" : preview),
        sent_at: new Date().toISOString(),
        send_status: "sending",
        sender_name: agentName,
        reply_to_message_id: input.replyToMessageId,
        attachment: input.attachment,
      };
      pendingRef.current[clientMessageId] = { conversationId: selectedId, input };
      updateMessages(selectedId, (prev) => upsertOptimisticMessage(prev, optimistic));
      applyListDelta({
        conversation_id: selectedId,
        last_message: preview,
        last_message_at: optimistic.sent_at,
        unread_count: 0,
      });
      void dispatchSend(selectedId, clientMessageId, input);
    },
    [selectedId, agentName, applyListDelta, dispatchSend, updateMessages],
  );

  const retry = useCallback(
    (clientMessageId: string) => {
      const pending = pendingRef.current[clientMessageId];
      if (!pending) return;
      updateMessages(pending.conversationId, (prev) => markMessageSending(prev, clientMessageId));
      void dispatchSend(pending.conversationId, clientMessageId, pending.input);
    },
    [dispatchSend, updateMessages],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!selectedId) return;
      const mapped = toInboxMessage(await messageService.remove(selectedId, messageId));
      updateMessages(selectedId, (prev) =>
        prev.map((item) => (item.id === messageId ? { ...item, ...mapped } : item)),
      );
    },
    [selectedId, toInboxMessage, updateMessages],
  );

  const saveNote = useCallback(
    async (content: string) => {
      if (!selectedId) return;
      try {
        const note = await conversationService.createNote(selectedId, content);
        setNotesById((prev) => ({ ...prev, [selectedId]: [note, ...(prev[selectedId] ?? [])] }));
        notify("success", "Internal note saved");
      } catch (err) {
        notify("error", formatApiErrorMessage(err));
      }
    },
    [selectedId, notify],
  );

  const applyMessage = useCallback(
    (message: Message) =>
      updateMessages(message.conversation_id, (prev) => reconcileApiMessage(prev, message, agentName)),
    [agentName, updateMessages],
  );

  const applyStatus = useCallback(
    (payload: StatusPayload) => {
      if (!payload.conversation_id) return;
      updateMessages(payload.conversation_id, (prev) => applyMessageStatusUpdate(prev, payload));
    },
    [updateMessages],
  );

  const applyActivity = useCallback((activity: InboxActivityEvent, conversationId: string) => {
    setActivitiesById((prev) => ({ ...prev, [conversationId]: prependUnique(prev[conversationId], activity) }));
  }, []);

  const applyNote = useCallback((note: InboxWorkspaceNote, conversationId: string) => {
    setNotesById((prev) => ({ ...prev, [conversationId]: prependUnique(prev[conversationId], note) }));
    setActivitiesById((prev) => ({
      ...prev,
      [conversationId]: prependUnique(prev[conversationId], {
        id: `activity-note-${note.id}`,
        type: "note_added",
        description: `Internal note added by ${note.author}`,
        created_at: note.created_at,
      }),
    }));
  }, []);

  const messages = selectedId ? messagesById[selectedId] : undefined;
  const error = selectedId ? (loadErrorById[selectedId] ?? null) : null;

  return {
    messages: messages ?? EMPTY,
    activities: (selectedId && activitiesById[selectedId]) || EMPTY_ACTIVITIES,
    notes: (selectedId && notesById[selectedId]) || EMPTY_NOTES,
    // Loading only on the first fetch; a reload keeps showing what is already there.
    loading: Boolean(selectedId) && messages === undefined && !error,
    error,
    reload: useCallback(() => setReloadTick((n) => n + 1), []),
    send,
    retry,
    deleteMessage,
    saveNote,
    applyMessage,
    applyStatus,
    applyActivity,
    applyNote,
  };
}

const EMPTY: InboxChatMessage[] = [];
const EMPTY_ACTIVITIES: InboxActivityEvent[] = [];
const EMPTY_NOTES: InboxWorkspaceNote[] = [];
