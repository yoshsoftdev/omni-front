import type { Message, MessageAttachment, MessageContentType, MessageDirection } from "@/types/message";

type ApiMessage = Message & {
  ID?: string;
  ConversationID?: string;
  Direction?: MessageDirection;
  ContentType?: MessageContentType;
  content_type?: MessageContentType;
  Sender?: string;
  sender?: string;
  SenderName?: string;
  ReceivedAt?: string;
  CreatedAt?: string;
  received_at?: string;
  created_at?: string;
  Attachment?: MessageAttachment;
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
    sender_name: raw.sender_name ?? raw.SenderName,
    sent_by: raw.sent_by,
    sent_at: readString(raw.sent_at, raw.received_at, raw.created_at, raw.ReceivedAt, raw.CreatedAt),
    wamid: raw.wamid,
  };
}

function contentTypeFromMime(mimeType: string): MessageContentType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("application/")) return "document";
  return "other";
}
