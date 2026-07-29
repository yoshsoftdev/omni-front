import { apiClient } from "@/services/api/client";
import type { WindowRecontactSettings } from "@/features/settings/types/window-recontact";

export const windowRecontactService = {
  async get(): Promise<WindowRecontactSettings> {
    const response = await apiClient.get<WindowRecontactSettings>("/inbox/settings/window-recontact");
    return response.data!;
  },

  async update(input: Partial<WindowRecontactSettings>): Promise<WindowRecontactSettings> {
    const response = await apiClient.patch<WindowRecontactSettings>(
      "/inbox/settings/window-recontact",
      input,
    );
    return response.data!;
  },
};
