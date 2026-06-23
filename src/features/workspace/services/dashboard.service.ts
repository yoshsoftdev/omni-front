import { apiClient } from "@/services/api/client";

export type DashboardOverview = {
  contacts: number;
  channels: number;
  campaigns: number;
  unread_conversations: number;
  readiness_score: number;
};

export const dashboardService = {
  async getOverview() {
    const response = await apiClient.get<DashboardOverview>("/dashboard");
    return response.data!;
  },
};
