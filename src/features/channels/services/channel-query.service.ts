import { getChannelRepository } from "@/features/channels/repositories/channel.repository";
import type { Channel } from "@/features/channels/types/channel";

const repository = getChannelRepository();

/**
 * Channel read façade for UI pages.
 * Delegates to ChannelRepository — never imports deviceService directly.
 */
export const channelQueryService = {
  async getChannels(): Promise<Channel[]> {
    return repository.list();
  },

  async getConnectedChannels(): Promise<Channel[]> {
    return repository.getConnected();
  },

  async getChannelById(id: string): Promise<Channel | undefined> {
    return repository.getById(id);
  },

  async getDefaultChannel(): Promise<Channel | undefined> {
    const connected = await repository.getConnected();
    return connected[0];
  },
};
