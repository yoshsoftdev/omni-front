export type ChannelStatus = "disconnected" | "connecting" | "connected";

export type ChannelConnectionType = "manual" | "embedded_coex";

export type ChannelType = "whatsapp" | "instagram" | (string & {});

export type ChannelProvider = "meta" | (string & {});

export type ChannelOnboardingStatus =
  | "pending"
  | "syncing_contacts"
  | "syncing_history"
  | "completed"
  | "failed";

export interface ChannelOnboarding {
  status?: ChannelOnboardingStatus;
  contacts_synced_count: number;
  history_messages_synced: number;
  history_sync_progress: number;
  error?: string;
  completed_at?: string;
}

/** Frontend domain model for workspace messaging channels (API wire: DeviceDTO / Channel). */
export interface Channel {
  id: string;
  workspace_id?: string;
  label: string;
  provider: ChannelProvider;
  channel_type?: ChannelType;
  status: ChannelStatus;
  connection_type?: ChannelConnectionType;
  waba_id?: string;
  phone_number_id?: string;
  phone_number?: string;
  is_coex: boolean;
  onboarding?: ChannelOnboarding;
  last_connected_at?: string;
  created_at?: string;
  updated_at?: string;
}
