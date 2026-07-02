import { channelRepositoryApi } from "@/features/channels/repositories/channel.repository.api";
import type { ManualVerifyResult } from "@/features/channels/services/channels-api.service";
import type { Channel, ChannelOnboarding } from "@/features/channels/types/channel";

export type CreateManualChannelInput = {
  name: string;
  access_token: string;
  waba_id: string;
  phone_number_id: string;
  phone_number: string;
  business_id?: string;
};

/** @deprecated Legacy wire format — use CreateManualChannelInput */
export type ConnectManualPayload = {
  phone_number_id: string;
  waba_id: string;
  access_token: string;
};

/** @deprecated Legacy wire format */
export type ConnectEmbeddedPayload = {
  code: string;
  waba_id: string;
  phone_number_id?: string;
};

export type VerifyManualChannelInput = {
  access_token: string;
  waba_id: string;
  phone_number_id: string;
};

export interface ChannelRepository {
  list(): Promise<Channel[]>;
  getById(id: string): Promise<Channel | undefined>;
  getConnected(): Promise<Channel[]>;
  verifyManual(input: VerifyManualChannelInput): Promise<ManualVerifyResult>;
  createManual(input: CreateManualChannelInput): Promise<Channel>;
  delete(id: string): Promise<void>;
  connectManual(id: string, input: ConnectManualPayload): Promise<Channel>;
  connectEmbedded(id: string, input: ConnectEmbeddedPayload): Promise<Channel>;
  disconnect(id: string): Promise<Channel>;
  getOnboardingStatus(id: string): Promise<ChannelOnboarding>;
  startOnboardingSync(id: string): Promise<ChannelOnboarding>;
}

export function getChannelRepository(): ChannelRepository {
  return channelRepositoryApi;
}
