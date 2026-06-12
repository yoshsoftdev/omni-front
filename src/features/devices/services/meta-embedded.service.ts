import { apiClient } from "@/services/api/client";

export type MetaEmbeddedConfig = {
  app_id: string;
  config_id: string;
  api_version: string;
  enabled: boolean;
};

export const metaEmbeddedService = {
  async getConfig() {
    const response = await apiClient.get<MetaEmbeddedConfig>("/meta/embedded-config");
    return response.data!;
  },
};
