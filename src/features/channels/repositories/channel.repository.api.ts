import { assertDomainChannel, assertDomainChannelList } from "@/features/channels/boundary/channel.boundary";
import {
  mapApiChannelListToChannels,
  mapApiChannelToChannel,
} from "@/features/channels/mappers/channel.mapper";
import type {
  ChannelRepository,
  ConnectEmbeddedPayload,
  ConnectManualPayload,
  CreateManualChannelInput,
  VerifyManualChannelInput,
} from "@/features/channels/repositories/channel.repository";
import type { Channel, ChannelOnboarding } from "@/features/channels/types/channel";
import { channelsApiService } from "@/features/channels/services/channels-api.service";

class ApiChannelRepository implements ChannelRepository {
  async list(): Promise<Channel[]> {
    const items = await channelsApiService.list();
    return assertDomainChannelList(mapApiChannelListToChannels(items));
  }

  async getById(id: string): Promise<Channel | undefined> {
    try {
      const item = await channelsApiService.getById(id);
      return assertDomainChannel(mapApiChannelToChannel(item));
    } catch {
      return undefined;
    }
  }

  async getConnected(): Promise<Channel[]> {
    const channels = await this.list();
    return channels.filter((channel) => channel.status === "connected");
  }

  async verifyManual(input: VerifyManualChannelInput) {
    return channelsApiService.verifyManual(input);
  }

  async createManual(input: CreateManualChannelInput): Promise<Channel> {
    const item = await channelsApiService.createManual({
      name: input.name,
      access_token: input.access_token,
      waba_id: input.waba_id,
      phone_number_id: input.phone_number_id,
      phone_number: input.phone_number,
    });
    return assertDomainChannel(mapApiChannelToChannel(item));
  }

  async delete(id: string): Promise<void> {
    await channelsApiService.delete(id);
  }

  async connectManual(_id: string, _input: ConnectManualPayload): Promise<Channel> {
    throw new Error("Use createManual for new manual WhatsApp connections");
  }

  async connectEmbedded(_id: string, _input: ConnectEmbeddedPayload): Promise<Channel> {
    throw new Error("Embedded Signup is not available yet");
  }

  async disconnect(_id: string): Promise<Channel> {
    throw new Error("Disconnect is not supported; delete the channel instead");
  }

  async getOnboardingStatus(_id: string): Promise<ChannelOnboarding> {
    throw new Error("Onboarding status is not available for manual channels");
  }

  async startOnboardingSync(_id: string): Promise<ChannelOnboarding> {
    throw new Error("Onboarding sync is not available for manual channels");
  }
}

export const channelRepositoryApi = new ApiChannelRepository();
