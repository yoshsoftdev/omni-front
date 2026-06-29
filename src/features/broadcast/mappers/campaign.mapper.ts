import type { Campaign, CampaignAudience, CampaignAudienceSource, CampaignStatus } from "@/features/broadcast/types/campaign";
import type { CampaignApiStatus, CampaignAudienceDTO, CampaignDTO } from "@/types/broadcast";

function readString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value != null && value !== "") {
      return String(value);
    }
  }
  return "";
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

function readBodyVariableMapping(record: Record<string, unknown>): Record<string, string> {
  const raw = record.variable_mapping ?? record.VariableMapping;
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const mapping = raw as Record<string, unknown>;
  const body = mapping.body ?? mapping.Body;
  if (body && typeof body === "object") {
    return body as Record<string, string>;
  }
  return {};
}

function readAudience(record: Record<string, unknown>): CampaignAudienceDTO | undefined {
  const raw = record.audience ?? record.Audience;
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const audience = raw as Record<string, unknown>;
  const type = readString(audience, "type", "Type") as CampaignAudienceDTO["type"];
  const name = readString(audience, "name", "Name");
  if (!name) {
    return undefined;
  }
  return {
    type,
    name,
    recipient_count: readNumber(audience, "recipient_count", "RecipientCount"),
    snapshot: Boolean(audience.snapshot ?? audience.Snapshot),
    snapshot_at: readString(audience, "snapshot_at", "SnapshotAt") || undefined,
    extra_audiences: readNumber(audience, "extra_audiences", "ExtraAudiences") || undefined,
  };
}

function readAudienceSources(record: Record<string, unknown>): CampaignAudienceSource[] {
  const raw = record.audiences ?? record.Audiences;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const source = item as Record<string, unknown>;
      const name = readString(source, "name", "Name");
      const id = readString(source, "id", "ID");
      const type = readString(source, "type", "Type");
      if (!name) {
        return null;
      }
      return { type, id, name };
    })
    .filter((item): item is CampaignAudienceSource => item != null);
}

/** Normalizes create/get/list campaign payloads from API v1 (nested or flat). */
export function normalizeCampaignDto(data: unknown): CampaignDTO {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid campaign response");
  }

  const root = data as Record<string, unknown>;
  const record = (root.Campaign ?? root.campaign ?? root) as Record<string, unknown>;
  const status = readString(record, "status", "Status") || "draft";

  return {
    id: readString(record, "id", "ID"),
    name: readString(record, "name", "Name"),
    status: status as CampaignApiStatus,
    device_id: readString(record, "device_id", "channel_id", "ChannelID", "DeviceID"),
    device_name: readString(record, "device_name", "DeviceName") || undefined,
    device_phone: readString(record, "device_phone", "DevicePhone") || undefined,
    template_id: readString(record, "template_id", "TemplateID"),
    template_name: readString(record, "template_name", "TemplateName") || undefined,
    template_category: readString(record, "template_category", "TemplateCategory") || undefined,
    template_language: readString(record, "template_language", "TemplateLanguage") || undefined,
    variable_mapping: {
      body: readBodyVariableMapping(record),
    },
    scheduled_at: readString(record, "scheduled_at", "ScheduledAt") || undefined,
    started_at: readString(record, "started_at", "StartedAt") || undefined,
    completed_at: readString(record, "completed_at", "CompletedAt") || undefined,
    total_contacts: readNumber(record, "total_contacts", "TotalContacts"),
    sent_count: readNumber(record, "sent_count", "SentCount"),
    delivered_count: readNumber(record, "delivered_count", "DeliveredCount"),
    read_count: readNumber(record, "read_count", "ReadCount"),
    failed_count: readNumber(record, "failed_count", "FailedCount"),
    audience: readAudience(record),
    audiences: readAudienceSources(record),
    created_at: readString(record, "created_at", "CreatedAt") || new Date().toISOString(),
    updated_at: readString(record, "updated_at", "UpdatedAt") || new Date().toISOString(),
  };
}

export function mapApiStatusToDomain(status: CampaignApiStatus): CampaignStatus {
  switch (status) {
    case "queued":
    case "sending":
      return "running";
    default:
      return status;
  }
}

export function mapDomainStatusToApi(status: CampaignStatus): CampaignApiStatus {
  if (status === "running") {
    return "sending";
  }
  return status;
}

export function mapCampaignDtoToCampaign(dto: CampaignDTO): Campaign {
  const audience: CampaignAudience | undefined = dto.audience
    ? {
        type: dto.audience.type ?? "",
        name: dto.audience.name,
        recipient_count: dto.audience.recipient_count ?? dto.total_contacts ?? 0,
        snapshot: dto.audience.snapshot ?? false,
        snapshot_at: dto.audience.snapshot_at,
        extra_audiences: dto.audience.extra_audiences,
        sources: dto.audiences ?? [],
      }
    : undefined;

  const primarySegment = audience?.type === "segment" ? audience.name : "";
  const segmentId =
    audience?.sources?.find((source) => source.type === "segment")?.id ?? "";

  return {
    id: dto.id,
    name: dto.name,
    status: mapApiStatusToDomain(dto.status),
    device_id: dto.device_id,
    device_name: dto.device_name,
    device_phone: dto.device_phone,
    template_id: dto.template_id,
    template_name: dto.template_name ?? "",
    template_category: dto.template_category ?? "",
    template_language: dto.template_language ?? "",
    segment_id: segmentId,
    segment_name: primarySegment,
    segment_contact_count: audience?.recipient_count ?? dto.total_contacts ?? 0,
    total_contacts: dto.total_contacts ?? 0,
    audience,
    audiences: dto.audiences ?? audience?.sources ?? [],
    scheduled_at: dto.scheduled_at,
    started_at: dto.started_at,
    completed_at: dto.completed_at,
    variable_mapping: dto.variable_mapping?.body ?? {},
    sent_count: dto.sent_count ?? 0,
    delivered_count: dto.delivered_count ?? 0,
    read_count: dto.read_count ?? 0,
    failed_count: dto.failed_count ?? 0,
    reply_count: 0,
    clicked_count: 0,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  };
}

export function mapCampaignToCampaignDto(campaign: Campaign): CampaignDTO {
  return {
    id: campaign.id,
    name: campaign.name,
    status: mapDomainStatusToApi(campaign.status),
    device_id: campaign.device_id ?? "",
    template_id: campaign.template_id,
    variable_mapping: {
      body: campaign.variable_mapping,
    },
    scheduled_at: campaign.scheduled_at,
    started_at: campaign.started_at,
    completed_at: campaign.completed_at,
    total_contacts: campaign.total_contacts,
    sent_count: campaign.sent_count,
    delivered_count: campaign.delivered_count,
    read_count: campaign.read_count,
    failed_count: campaign.failed_count,
    device_name: campaign.device_name,
    device_phone: campaign.device_phone,
    template_name: campaign.template_name,
    template_language: campaign.template_language,
    template_category: campaign.template_category,
    created_at: campaign.created_at,
    updated_at: campaign.updated_at ?? campaign.created_at,
  };
}
