import {
  parseDeviceDto,
  parseDeviceDtoList,
  parseOnboardingStatusDto,
} from "@/features/channels/boundary/channel.boundary";
import type {
  ChannelRepository,
  ConnectEmbeddedPayload,
  ConnectManualPayload,
} from "@/features/channels/repositories/channel.repository";
import type { Channel, ChannelOnboarding } from "@/features/channels/types/channel";
import { deviceService } from "@/features/devices/services/device.service";

/**
 * API channel repository — sole consumer of deviceService.
 * All DeviceDTO responses pass through channel.boundary before returning Channel.
 */
class ApiChannelRepository implements ChannelRepository {
  async list(): Promise<Channel[]> {
    const dtos = await deviceService.list();
    return parseDeviceDtoList(dtos);
  }

  async getById(id: string): Promise<Channel | undefined> {
    const channels = await this.list();
    return channels.find((channel) => channel.id === id);
  }

  async getConnected(): Promise<Channel[]> {
    const channels = await this.list();
    return channels.filter((channel) => channel.status === "connected");
  }

  async connectManual(id: string, input: ConnectManualPayload): Promise<Channel> {
    const dto = await deviceService.connect(id, input);
    return parseDeviceDto(dto);
  }

  async connectEmbedded(id: string, input: ConnectEmbeddedPayload): Promise<Channel> {
    const dto = await deviceService.connectEmbedded(id, input);
    return parseDeviceDto(dto);
  }

  async disconnect(id: string): Promise<Channel> {
    const dto = await deviceService.disconnect(id);
    return parseDeviceDto(dto);
  }

  async getOnboardingStatus(id: string): Promise<ChannelOnboarding> {
    const dto = await deviceService.getOnboardingStatus(id);
    return parseOnboardingStatusDto(dto);
  }

  async startOnboardingSync(id: string): Promise<ChannelOnboarding> {
    const dto = await deviceService.startOnboardingSync(id);
    return parseOnboardingStatusDto(dto);
  }
}

export const channelRepositoryApi = new ApiChannelRepository();
