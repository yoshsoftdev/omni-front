import { channelRepositoryApi } from "@/features/channels/repositories/channel.repository.api";
import type { Channel, ChannelOnboarding } from "@/features/channels/types/channel";
import type { ConnectDeviceInput, ConnectEmbeddedInput } from "@/types/device";

export type ConnectManualPayload = ConnectDeviceInput;

export type ConnectEmbeddedPayload = ConnectEmbeddedInput;

export interface ChannelRepository {
  list(): Promise<Channel[]>;
  getById(id: string): Promise<Channel | undefined>;
  getConnected(): Promise<Channel[]>;
  connectManual(id: string, input: ConnectManualPayload): Promise<Channel>;
  connectEmbedded(id: string, input: ConnectEmbeddedPayload): Promise<Channel>;
  disconnect(id: string): Promise<Channel>;
  getOnboardingStatus(id: string): Promise<ChannelOnboarding>;
  startOnboardingSync(id: string): Promise<ChannelOnboarding>;
}

export function getChannelRepository(): ChannelRepository {
  return channelRepositoryApi;
}
