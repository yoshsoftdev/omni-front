import { getChannelRepository } from "@/features/channels/repositories/channel.repository";
import type { CreateManualChannelInput, VerifyManualChannelInput } from "@/features/channels/repositories/channel.repository";
import type { ManualVerifyResult } from "@/features/channels/services/channels-api.service";
import type { Channel } from "@/features/channels/types/channel";

const repository = getChannelRepository();

export const channelCommandService = {
  async verifyManualConnection(input: VerifyManualChannelInput): Promise<ManualVerifyResult> {
    return repository.verifyManual(input);
  },

  async createManualConnection(input: CreateManualChannelInput): Promise<Channel> {
    return repository.createManual(input);
  },

  async deleteChannel(id: string): Promise<void> {
    await repository.delete(id);
  },
};
