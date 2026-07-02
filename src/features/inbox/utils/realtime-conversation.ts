export type RealtimeConversationStatus = "open" | "closed";

export function conversationsMatchId(a: string, b: string) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export function extractConversationId(data: Record<string, unknown>): string {
  const direct = data.id ?? data.ID;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }
  const nested = data.conversation_id ?? data.ConversationID;
  if (typeof nested === "string" && nested.trim()) {
    return nested.trim();
  }
  return "";
}

function parseMetadata(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeBackendStatus(value: unknown): RealtimeConversationStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "closed" || normalized === "resolved") return "closed";
  if (normalized === "open" || normalized === "pending") return "open";
  return null;
}

export function extractStatusFromRealtimeData(
  data: Record<string, unknown>,
  eventType?: string,
): RealtimeConversationStatus | null {
  if (eventType === "conversation.closed") return "closed";
  if (eventType === "conversation.reopened") return "open";

  const activityType = String(data.type ?? data.Type ?? "");
  if (activityType === "closed") return "closed";
  if (activityType === "reopened") return "open";

  const directStatus = normalizeBackendStatus(data.status ?? data.Status);
  if (directStatus) return directStatus;

  const metadata = parseMetadata(data.metadata ?? data.Metadata);
  if (metadata) {
    const metaStatus = normalizeBackendStatus(metadata.status);
    if (metaStatus) return metaStatus;
  }

  return null;
}
