import type {
  ConsentStatus,
  Contact,
  ContactCustomField,
  ContactFieldDefinition,
  ContactFieldType,
  ContactLastCampaign,
  ContactSource,
  MarketingStatus,
} from "@/types/contact";

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
  Country?: string;
  Province?: string;
  Company?: string;
  JobTitle?: string;
  Language?: string;
  CustomerType?: string;
  Notes?: string;
  CustomFields?: ApiCustomField[];
  LastCampaign?: ApiLastCampaign;
  ConversationsCount?: number;
};

type ApiCustomField = {
  id?: string;
  ID?: string;
  field_key?: string;
  FieldKey?: string;
  label?: string;
  Label?: string;
  field_type?: string;
  FieldType?: string;
  options?: unknown;
  Options?: unknown;
  value?: unknown;
  Value?: unknown;
};

type ApiLastCampaign = Partial<ContactLastCampaign> & {
  ID?: string;
  Name?: string;
  SentAt?: string;
};

function readString(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

export function mapMarketingStatus(status?: string): MarketingStatus {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "subscribed" || normalized === "opt_in") return "subscribed";
  if (normalized === "unsubscribed" || normalized === "opt_out") return "unsubscribed";
  return "unknown";
}

export function mapConsentStatus(status?: string): ConsentStatus {
  const marketing = mapMarketingStatus(status);
  if (marketing === "subscribed") return "opt_in";
  if (marketing === "unsubscribed") return "opt_out";
  return "unknown";
}

export function consentToMarketing(status?: ConsentStatus): MarketingStatus {
  if (status === "opt_in") return "subscribed";
  if (status === "opt_out") return "unsubscribed";
  return "unknown";
}

function mapSource(source?: string): ContactSource {
  const normalized = (source ?? "").toLowerCase();
  if (normalized === "whatsapp" || normalized === "meta_inbound") return normalized === "meta_inbound" ? "meta_inbound" : "whatsapp";
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

function parseFieldOptions(raw: unknown): string[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item));
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function parseCustomFieldValue(raw: unknown): string | number | boolean | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "boolean" || typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed !== "" && !Number.isNaN(Number(trimmed)) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed === "boolean" || typeof parsed === "number" || typeof parsed === "string") {
        return parsed;
      }
      if (parsed === null) return null;
    } catch {
      return raw;
    }
    return raw;
  }
  return String(raw);
}

function mapCustomFields(raw: ApiContact): ContactCustomField[] {
  const rows = (raw.custom_fields ?? raw.CustomFields ?? []) as ApiCustomField[];
  return rows
    .map((field) => {
      const fieldType = readString(field.field_type, field.FieldType) as ContactFieldType;
      const valueRaw = field.value ?? field.Value;
      return {
        id: readString(field.id, field.ID),
        field_key: readString(field.field_key, field.FieldKey),
        label: readString(field.label, field.Label),
        field_type: fieldType || "text",
        options: parseFieldOptions(field.options ?? field.Options),
        value: parseCustomFieldValue(valueRaw),
      };
    })
    .filter((field) => field.id);
}

function mapLastCampaign(raw?: ApiLastCampaign): ContactLastCampaign | undefined {
  if (!raw) return undefined;
  const id = readString(raw.id, raw.ID);
  if (!id) return undefined;
  return {
    id,
    name: readString(raw.name, raw.Name),
    sent_at: readString(raw.sent_at, raw.SentAt),
  };
}

export function normalizeFieldDefinition(raw: Partial<ContactFieldDefinition> & {
  FieldKey?: string;
  FieldType?: string;
  SortOrder?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}): ContactFieldDefinition {
  return {
    id: readString(raw.id, (raw as { ID?: string }).ID),
    field_key: readString(raw.field_key, raw.FieldKey),
    label: readString(raw.label, (raw as { Label?: string }).Label),
    field_type: (readString(raw.field_type, raw.FieldType) || "text") as ContactFieldType,
    options: parseFieldOptions(raw.options),
    sort_order: raw.sort_order ?? raw.SortOrder ?? 0,
    created_at: readString(raw.created_at, raw.CreatedAt) || new Date(0).toISOString(),
    updated_at: readString(raw.updated_at, raw.UpdatedAt) || new Date(0).toISOString(),
  };
}

export function normalizeContact(raw: ApiContact): Contact {
  const id = readString(raw.id, raw.ID);
  const createdAt = readString(raw.created_at, raw.CreatedAt) || new Date(0).toISOString();
  const updatedAt = readString(raw.updated_at, raw.UpdatedAt) || createdAt;
  const marketingStatus = mapMarketingStatus(
    raw.marketing_status
    ?? raw.consent_status
    ?? raw.MarketingStatus
    ?? (raw as { marketing_status?: string }).marketing_status,
  );

  return {
    id,
    name: readString(raw.name, raw.Name),
    phone: readString(raw.phone, raw.Phone),
    email: readString(raw.email, raw.Email) || undefined,
    source: mapSource(raw.source ?? raw.Source),
    tags: mapTags(raw),
    consent_status: mapConsentStatus(marketingStatus),
    marketing_status: marketingStatus,
    last_activity_at: readString(raw.last_activity_at, raw.LastActivityAt) || undefined,
    country: readString(raw.country, raw.Country) || undefined,
    province: readString(raw.province, raw.Province) || undefined,
    city: readString(raw.city, raw.City) || undefined,
    company: readString(raw.company, raw.Company) || undefined,
    job_title: readString(raw.job_title, raw.JobTitle) || undefined,
    language: readString(raw.language, raw.Language) || undefined,
    customer_type: readString(raw.customer_type, raw.CustomerType) || undefined,
    notes: readString(raw.notes, raw.Notes) || undefined,
    custom_fields: mapCustomFields(raw),
    created_at: createdAt,
    updated_at: updatedAt,
    conversations_count: raw.conversations_count ?? raw.ConversationsCount ?? 0,
    last_campaign: mapLastCampaign(raw.last_campaign ?? raw.LastCampaign),
    campaigns_received: raw.campaigns_received ?? 0,
    campaigns_clicked: raw.campaigns_clicked ?? 0,
    last_conversation_at: raw.last_conversation_at,
  };
}

export function serializeCustomFieldValue(
  fieldType: ContactFieldType,
  value: string | number | boolean | null | undefined,
): unknown {
  if (value === undefined || value === null || value === "") return null;
  if (fieldType === "number") return Number(value);
  if (fieldType === "boolean") return Boolean(value);
  return value;
}
