import { apiClient } from "@/services/api/client";

export type ApiChannel = {
  id: string;
  team_id: string;
  name: string;
  provider: string;
  status: string;
  connection_type?: string;
  phone_number?: string;
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
  is_coex?: boolean;
  last_connected_at?: string;
  created_at?: string;
  updated_at?: string;
};

type PageResponse<T> = {
  items: T[];
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

export type CreateManualChannelPayload = {
  name: string;
  access_token: string;
  waba_id: string;
  phone_number_id: string;
  phone_number: string;
  business_id?: string;
};

export type VerifyManualChannelPayload = {
  access_token: string;
  waba_id: string;
  phone_number_id: string;
};

export type ManualVerifyResult = {
  waba_name?: string;
  phone_display?: string;
  template_count: number;
  checks: {
    token: boolean;
    waba: boolean;
    phone: boolean;
    templates_api: boolean;
  };
};

export const channelsApiService = {
  async list(): Promise<ApiChannel[]> {
    const response = await apiClient.get<PageResponse<ApiChannel>>("/channels?page_size=100");
    return response.data?.items ?? [];
  },

  async getById(id: string): Promise<ApiChannel> {
    const response = await apiClient.get<ApiChannel>(`/channels/${id}`);
    return response.data!;
  },

  async verifyManual(payload: VerifyManualChannelPayload): Promise<ManualVerifyResult> {
    const response = await apiClient.post<ManualVerifyResult>("/channels/manual/verify", {
      access_token: payload.access_token,
      waba_id: payload.waba_id,
      phone_number_id: payload.phone_number_id,
    });
    return response.data!;
  },

  async createManual(payload: CreateManualChannelPayload): Promise<ApiChannel> {
    const response = await apiClient.post<ApiChannel>("/channels", {
      name: payload.name,
      provider: "meta_whatsapp",
      connection_type: "manual",
      phone_number: payload.phone_number,
      access_token: payload.access_token,
      waba_id: payload.waba_id,
      phone_number_id: payload.phone_number_id,
      business_id: payload.business_id,
    });
    return response.data!;
  },

  async createEmbeddedPlaceholder(name: string): Promise<ApiChannel> {
    const response = await apiClient.post<ApiChannel>("/channels", {
      name,
      provider: "meta_whatsapp",
      connection_type: "embedded_coex",
    });
    return response.data!;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/channels/${id}`);
  },
};
