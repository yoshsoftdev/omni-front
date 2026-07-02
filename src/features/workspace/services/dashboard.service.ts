import { apiClient } from "@/services/api/client";

export type DashboardOverview = {
  contacts: number;
  channels: number;
  campaigns: number;
  unread_conversations: number;
  readiness_score: number;
  last_contact_sync_at?: string;
  last_template_sync_at?: string;
  last_conversation_sync_at?: string;
  permission_status?: string;
};

export const dashboardService = {
  async getOverview() {
    const response = await apiClient.get<DashboardOverview>("/dashboard");
    return response.data!;
  },
};
