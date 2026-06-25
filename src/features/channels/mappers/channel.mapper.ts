import type {
  Channel,
  ChannelConnectionType,
  ChannelOnboarding,
  ChannelOnboardingStatus,
  ChannelProvider,
  ChannelStatus,
} from "@/features/channels/types/channel";
import type { DeviceDTO, DeviceOnboardingDTO, OnboardingStatusResponse } from "@/types/device";

function normalizeStatus(status?: string): ChannelStatus {
  const value = (status ?? "disconnected").toLowerCase();
  if (value === "connecting" || value === "connected") {
    return value;
  }
  return "disconnected";
}

function normalizeConnectionType(type?: string): ChannelConnectionType | undefined {
  if (type === "manual" || type === "embedded_coex") {
    return type;
  }
  return undefined;
}

function normalizeProvider(provider?: string): ChannelProvider {
  const value = (provider ?? "meta").trim().toLowerCase();
  return value || "meta";
}

function normalizeOnboardingStatus(status?: string): ChannelOnboardingStatus | undefined {
  if (
    status === "pending" ||
    status === "syncing_contacts" ||
    status === "syncing_history" ||
    status === "completed" ||
    status === "failed"
  ) {
    return status;
  }
  return undefined;
}

function mapOnboardingDtoToOnboarding(dto?: DeviceOnboardingDTO): ChannelOnboarding | undefined {
  if (!dto) {
    return undefined;
  }
  return mapOnboardingFieldsToChannelOnboarding(dto);
}

function mapOnboardingFieldsToChannelOnboarding(dto: DeviceOnboardingDTO): ChannelOnboarding {
  return {
    status: normalizeOnboardingStatus(dto.status),
    contacts_synced_count: dto.contacts_synced_count,
    history_messages_synced: dto.history_messages_synced,
    history_sync_progress: dto.history_sync_progress,
    error: dto.error,
    completed_at: dto.completed_at,
  };
}

export function mapOnboardingStatusResponseToChannelOnboarding(
  dto: OnboardingStatusResponse,
): ChannelOnboarding {
  return mapOnboardingFieldsToChannelOnboarding(dto);
}

function mapOnboardingToDto(onboarding?: ChannelOnboarding): DeviceOnboardingDTO | undefined {
  if (!onboarding) {
    return undefined;
  }
  return {
    status: onboarding.status,
    contacts_synced_count: onboarding.contacts_synced_count,
    history_messages_synced: onboarding.history_messages_synced,
    history_sync_progress: onboarding.history_sync_progress,
    error: onboarding.error,
    completed_at: onboarding.completed_at,
  };
}

export function mapApiChannelToChannel(dto: {
  id: string;
  team_id?: string;
  name: string;
  provider?: string;
  status?: string;
  connection_type?: string;
  waba_id?: string;
  phone_number_id?: string;
  phone_number?: string;
  is_coex?: boolean;
  last_connected_at?: string;
  created_at?: string;
  updated_at?: string;
}): Channel {
  return {
    id: dto.id,
    workspace_id: dto.team_id,
    label: dto.name,
    provider: normalizeProvider(dto.provider),
    status: normalizeStatus(dto.status),
    connection_type: normalizeConnectionType(dto.connection_type),
    waba_id: dto.waba_id,
    phone_number_id: dto.phone_number_id,
    phone_number: dto.phone_number,
    is_coex: Boolean(dto.is_coex),
    last_connected_at: dto.last_connected_at,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  };
}

export function mapApiChannelListToChannels(dtos: Parameters<typeof mapApiChannelToChannel>[0][]): Channel[] {
  return dtos.map(mapApiChannelToChannel);
}

export function mapDeviceDtoToChannel(dto: DeviceDTO): Channel {
  return {
    id: dto.id,
    workspace_id: dto.workspace_id,
    label: dto.name,
    provider: normalizeProvider(dto.provider),
    status: normalizeStatus(dto.status),
    connection_type: normalizeConnectionType(dto.connection_type),
    waba_id: dto.waba_id,
    phone_number_id: dto.phone_number_id,
    phone_number: dto.phone_number,
    is_coex: Boolean(dto.is_coex),
    onboarding: mapOnboardingDtoToOnboarding(dto.onboarding),
    last_connected_at: dto.last_connected_at,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  };
}

export function mapChannelToDeviceDto(channel: Channel): DeviceDTO {
  return {
    id: channel.id,
    workspace_id: channel.workspace_id,
    name: channel.label,
    provider: channel.provider,
    status: channel.status,
    connection_type: channel.connection_type,
    waba_id: channel.waba_id,
    phone_number_id: channel.phone_number_id,
    phone_number: channel.phone_number,
    is_coex: channel.is_coex,
    onboarding: mapOnboardingToDto(channel.onboarding),
    last_connected_at: channel.last_connected_at,
    created_at: channel.created_at ?? new Date(0).toISOString(),
    updated_at: channel.updated_at ?? channel.created_at ?? new Date(0).toISOString(),
  };
}

export {
  normalizeConnectionType,
  normalizeOnboardingStatus,
  normalizeProvider,
  normalizeStatus,
};
