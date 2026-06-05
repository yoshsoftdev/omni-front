export type DeviceStatus = "disconnected" | "connecting" | "connected";

export interface Device {
  id: string;
  name: string;
  phone_number?: string;
  waba_id?: string;
  phone_number_id?: string;
  provider: string;
  status: DeviceStatus;
  last_connected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectDeviceInput {
  phone_number_id: string;
  waba_id: string;
  access_token: string;
}
