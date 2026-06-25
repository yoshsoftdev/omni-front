import { apiClient } from "@/services/api/client";

export type StartEmbeddedSignupResponse = {
  session_id: string;
  oauth_state: string;
  status: string;
  expires_at: string;
};

export type CompleteEmbeddedSignupResponse = {
  channel_id: string;
  status: string;
  business_id?: string;
  waba_id?: string;
  phone_number_id?: string;
  phone_number?: string;
};

export type EmbeddedSignupStatusResponse = {
  session_id: string;
  status: string;
  business_id?: string;
  waba_id?: string;
  phone_number_id?: string;
  error_message?: string;
  expires_at: string;
  completed_at?: string;
};

export const embeddedSignupService = {
  async start(channelId: string) {
    const response = await apiClient.post<StartEmbeddedSignupResponse>(
      `/channels/${channelId}/embedded-signup/start`,
    );
    return response.data!;
  },

  async complete(
    channelId: string,
    sessionId: string,
    body: {
      code: string;
      oauth_state: string;
      business_id?: string;
      waba_id: string;
      phone_number_id: string;
    },
  ) {
    const response = await apiClient.post<CompleteEmbeddedSignupResponse>(
      `/channels/${channelId}/embedded-signup/${sessionId}/complete`,
      body,
    );
    return response.data!;
  },

  async getStatus(channelId: string, sessionId: string) {
    const response = await apiClient.get<EmbeddedSignupStatusResponse>(
      `/channels/${channelId}/embedded-signup/${sessionId}`,
    );
    return response.data!;
  },
};
