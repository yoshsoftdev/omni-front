import type { Campaign, CampaignStatus } from "@/features/broadcast/types/campaign";
import type { CampaignApiStatus, CampaignDTO } from "@/types/broadcast";

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
    segment_id: "",
    segment_name: "",
    segment_contact_count: dto.total_contacts,
    total_contacts: dto.total_contacts,
    scheduled_at: dto.scheduled_at,
    started_at: dto.started_at,
    completed_at: dto.completed_at,
    variable_mapping: dto.variable_mapping.body ?? {},
    sent_count: dto.sent_count,
    delivered_count: dto.delivered_count,
    read_count: dto.read_count,
    failed_count: dto.failed_count,
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
