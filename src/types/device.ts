export type DeviceStatus = "disconnected" | "connecting" | "connected";

export type ConnectionType = "manual" | "embedded_coex";

export type OnboardingStatus =
  | "pending"
  | "syncing_contacts"
  | "syncing_history"
  | "completed"
  | "failed";

export interface DeviceOnboardingDTO {
  status?: OnboardingStatus;
  contacts_synced_count: number;
  history_messages_synced: number;
  history_sync_progress: number;
  error?: string;
  completed_at?: string;
}

/** @deprecated Use DeviceOnboardingDTO */
export type DeviceOnboarding = DeviceOnboardingDTO;

/** Backend API wire format for devices (channels). */
export interface DeviceDTO {
  id: string;
  workspace_id?: string;
  name: string;
  phone_number?: string;
  waba_id?: string;
  phone_number_id?: string;
  provider: string;
  status: DeviceStatus;
  connection_type?: ConnectionType;
  is_coex?: boolean;
  onboarding?: DeviceOnboardingDTO;
  last_connected_at?: string;
  created_at: string;
  updated_at: string;
}

/** @deprecated Use DeviceDTO */
export type Device = DeviceDTO;

export interface ConnectDeviceInput {
  phone_number_id: string;
  waba_id: string;
  access_token: string;
}

export interface ConnectEmbeddedInput {
  code: string;
  waba_id: string;
  phone_number_id?: string;
}

export interface OnboardingStatusResponse {
  status?: OnboardingStatus;
  contacts_synced_count: number;
  history_messages_synced: number;
  history_sync_progress: number;
  error?: string;
  completed_at?: string;
}
