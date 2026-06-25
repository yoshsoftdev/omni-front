import type { ConsentStatus, Contact, ContactSource } from "@/types/contact";

type ApiContact = Partial<Contact> & {
  ID?: string;
  Name?: string;
  Phone?: string;
  Email?: string;
  Source?: string;
  MarketingStatus?: string;
  LastActivityAt?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  City?: string;
  Language?: string;
  CustomerType?: string;
  Notes?: string;
};

function readString(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function mapMarketingStatus(status?: string): ConsentStatus {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "subscribed" || normalized === "opt_in") return "opt_in";
  if (normalized === "unsubscribed" || normalized === "opt_out") return "opt_out";
  return "unknown";
}

function mapSource(source?: string): ContactSource {
  const normalized = (source ?? "").toLowerCase();
  if (normalized === "whatsapp" || normalized === "meta_inbound") return "whatsapp";
  if (normalized === "import") return "import";
  if (normalized === "api") return "api";
  return "manual";
}

function mapTags(raw: ApiContact): Contact["tags"] {
  const rows = raw.tags ?? [];
  return rows
    .map((tag) => ({
      id: readString(tag.id, (tag as { ID?: string }).ID),
      name: readString(tag.name, (tag as { Name?: string }).Name),
      color: readString(tag.color, (tag as { Color?: string }).Color) || "#6366f1",
    }))
    .filter((tag) => tag.id);
}

export function normalizeContact(raw: ApiContact): Contact {
  const id = readString(raw.id, raw.ID);
  const createdAt = readString(raw.created_at, raw.CreatedAt) || new Date(0).toISOString();
  const updatedAt = readString(raw.updated_at, raw.UpdatedAt) || createdAt;

  return {
    id,
    name: readString(raw.name, raw.Name),
    phone: readString(raw.phone, raw.Phone),
    email: readString(raw.email, raw.Email) || undefined,
    source: mapSource(raw.source ?? raw.Source),
    tags: mapTags(raw),
    consent_status: mapMarketingStatus(
      raw.consent_status ?? raw.MarketingStatus ?? (raw as { marketing_status?: string }).marketing_status,
    ),
    last_activity_at: readString(raw.last_activity_at, raw.LastActivityAt) || undefined,
    language: readString(raw.language, raw.Language) || undefined,
    customer_type: readString(raw.customer_type, raw.CustomerType) || undefined,
    city: readString(raw.city, raw.City) || undefined,
    notes: readString(raw.notes, raw.Notes) || undefined,
    created_at: createdAt,
    updated_at: updatedAt,
    conversations_count: raw.conversations_count ?? 0,
    campaigns_received: raw.campaigns_received ?? 0,
    campaigns_clicked: raw.campaigns_clicked ?? 0,
    last_conversation_at: raw.last_conversation_at,
    recent_campaigns: raw.recent_campaigns,
    activities: raw.activities,
  };
}
