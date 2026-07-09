import type { Message, MessageAttachment, MessageContentType, MessageDirection } from "@/types/message";

type ApiMessage = Message & {
  ID?: string;
  ConversationID?: string;
  Direction?: MessageDirection;
  ContentType?: MessageContentType;
  content_type?: MessageContentType;
  Sender?: string;
  sender?: string;
  Recipient?: string;
  recipient?: string;
  SenderName?: string;
  ReceivedAt?: string;
  CreatedAt?: string;
  received_at?: string;
  created_at?: string;
  Attachment?: MessageAttachment;
  ReplyToWAMID?: string;
  reply_to_wamid?: string;
  ReplyToMessageID?: string;
  reply_to_message_id?: string;
  IsDeleted?: boolean;
  is_deleted?: boolean;
  DeletedAt?: string;
  deleted_at?: string;
  DeletedBySource?: "user_wa" | "agent_app" | "system";
  deleted_by_source?: "user_wa" | "agent_app" | "system";
};

function readString(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function normalizeAttachment(raw?: MessageAttachment | Partial<MessageAttachment>): MessageAttachment | undefined {
  if (!raw) return undefined;
  const record = raw as Partial<MessageAttachment> & {
    storageObjectId?: string;
    StorageObjectID?: string;
    mimeType?: string;
    MimeType?: string;
    sizeBytes?: number;
    SizeBytes?: number;
    Filename?: string;
  };
  const storageObjectID = readString(
    record.storage_object_id,
    record.storageObjectId,
    record.StorageObjectID,
  );
  if (!storageObjectID) return undefined;
  return {
    storage_object_id: storageObjectID,
    mime_type: readString(record.mime_type, record.mimeType, record.MimeType),
    size_bytes: Number(record.size_bytes ?? record.sizeBytes ?? record.SizeBytes ?? 0),
    filename: readString(record.filename, record.Filename, "attachment"),
  };
}

export function normalizeMessage(raw: ApiMessage): Message {
  const attachment = normalizeAttachment(raw.attachment ?? raw.Attachment);
  return {
    id: readString(raw.id, raw.ID),
    conversation_id: readString(raw.conversation_id, raw.ConversationID),
    direction: raw.direction ?? raw.Direction ?? "inbound",
    content: raw.content ?? "",
    content_type: raw.content_type ?? raw.ContentType ?? (attachment ? contentTypeFromMime(attachment.mime_type) : "text"),
    attachment,
    sender_phone: readString(raw.sender_phone, raw.sender, raw.Sender),
    recipient_phone: readString(raw.recipient_phone, raw.recipient, raw.Recipient),
    sender_name: raw.sender_name ?? raw.SenderName,
    sent_by: raw.sent_by,
    sent_at: readString(raw.sent_at, raw.received_at, raw.created_at, raw.ReceivedAt, raw.CreatedAt),
    wamid: raw.wamid,
    reply_to_wamid: readString(raw.reply_to_wamid, raw.ReplyToWAMID),
    reply_to_message_id: readString(raw.reply_to_message_id, raw.ReplyToMessageID),
    is_deleted: Boolean(raw.is_deleted ?? raw.IsDeleted),
    deleted_at: readString(raw.deleted_at, raw.DeletedAt),
    deleted_by_source: raw.deleted_by_source ?? raw.DeletedBySource,
  };
}

function contentTypeFromMime(mimeType: string): MessageContentType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("application/")) return "document";
  return "other";
}
