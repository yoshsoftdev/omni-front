/**
 * Official Campaign domain boundary.
 *
 * All CampaignDTO data must pass through this module before reaching UI layers.
 * Mock repository uses native Campaign objects from campaign-mock-data.ts.
 * API repository (future) must use parseCampaignDto / serializeCampaign here.
 */
import {
  mapApiStatusToDomain,
  mapCampaignDtoToCampaign,
  mapCampaignToCampaignDto,
  mapDomainStatusToApi,
} from "@/features/broadcast/mappers/campaign.mapper";
import type { Campaign, CampaignStatus } from "@/features/broadcast/types/campaign";
import type { CampaignApiStatus, CampaignDTO } from "@/types/broadcast";

const API_ONLY_STATUSES = new Set<string>(["queued", "sending"]);

export function parseCampaignDto(dto: CampaignDTO): Campaign {
  const campaign = mapCampaignDtoToCampaign(dto);
  return assertDomainCampaign(campaign);
}

export function parseCampaignDtoList(dtos: CampaignDTO[]): Campaign[] {
  return dtos.map(parseCampaignDto);
}

export function serializeCampaign(campaign: Campaign): CampaignDTO {
  return mapCampaignToCampaignDto(campaign);
}

export function assertDomainCampaign(campaign: Campaign): Campaign {
  if (API_ONLY_STATUSES.has(campaign.status)) {
    throw new Error(
      `Campaign domain boundary violation: API status "${campaign.status}" must not reach UI`,
    );
  }
  return campaign;
}

export function assertDomainCampaignList(campaigns: Campaign[]): Campaign[] {
  return campaigns.map(assertDomainCampaign);
}

export {
  mapApiStatusToDomain,
  mapDomainStatusToApi,
  mapCampaignDtoToCampaign,
  mapCampaignToCampaignDto,
};

export type { CampaignApiStatus, CampaignDTO, Campaign, CampaignStatus };

/*
 * Future: campaign.repository.api.ts (sole consumer of boundary + mapper)
 *
 *   async list(): Promise<Campaign[]> {
 *     const dtos = await apiClient.get<{ campaigns: CampaignDTO[] }>("/campaigns");
 *     return parseCampaignDtoList(dtos.data?.campaigns ?? []);
 *   }
 *
 *   async getById(id: string): Promise<Campaign> {
 *     const dto = await apiClient.get<CampaignDTO>(`/campaigns/${id}`);
 *     return parseCampaignDto(dto.data!);
 *   }
 *
 * UI pages import Campaign only — never CampaignDTO.
 */
