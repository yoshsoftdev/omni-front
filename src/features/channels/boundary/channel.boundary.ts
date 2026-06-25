/**
 * Official Channel domain boundary.
 *
 * All DeviceDTO data must pass through this module before reaching UI layers.
 * channel.repository.api.ts routes API responses here before returning Channel.
 */
import {
  mapChannelToDeviceDto,
  mapDeviceDtoToChannel,
  mapOnboardingStatusResponseToChannelOnboarding,
} from "@/features/channels/mappers/channel.mapper";
import type { Channel, ChannelOnboarding } from "@/features/channels/types/channel";
import type { DeviceDTO, OnboardingStatusResponse } from "@/types/device";

export function parseDeviceDto(dto: DeviceDTO): Channel {
  const channel = mapDeviceDtoToChannel(dto);
  return assertDomainChannel(channel);
}

export function parseDeviceDtoList(dtos: DeviceDTO[]): Channel[] {
  return dtos.map(parseDeviceDto);
}

export function serializeChannel(channel: Channel): DeviceDTO {
  return mapChannelToDeviceDto(channel);
}

export function assertDomainChannel(channel: Channel): Channel {
  if (!channel.id.trim()) {
    throw new Error("Channel domain boundary violation: id is required");
  }
  if (!channel.label.trim()) {
    throw new Error("Channel domain boundary violation: label is required");
  }
  if (!channel.provider.trim()) {
    throw new Error("Channel domain boundary violation: provider is required");
  }
  return channel;
}

export function parseOnboardingStatusDto(dto: OnboardingStatusResponse): ChannelOnboarding {
  return mapOnboardingStatusResponseToChannelOnboarding(dto);
}

export function assertDomainChannelList(channels: Channel[]): Channel[] {
  return channels.map(assertDomainChannel);
}

export { mapDeviceDtoToChannel, mapChannelToDeviceDto, mapOnboardingStatusResponseToChannelOnboarding };

export type { Channel, ChannelOnboarding, DeviceDTO };

/*
 * channel.repository.api.ts routes API responses through channel.boundary before returning Channel.
 * UI pages import Channel via channelQueryService — never DeviceDTO.
 */
