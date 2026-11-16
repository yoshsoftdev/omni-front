import { apiClient } from "@/services/api/client";
import type { KeywordRule, KeywordRuleInput, WelcomeSettings } from "@/features/settings/types/auto-reply";

export const autoReplyService = {
  async getWelcome(): Promise<WelcomeSettings> {
    const response = await apiClient.get<WelcomeSettings>("/inbox/settings/welcome");
    return response.data!;
  },

  async updateWelcome(input: WelcomeSettings): Promise<WelcomeSettings> {
    const response = await apiClient.put<WelcomeSettings>("/inbox/settings/welcome", input);
    return response.data!;
  },

  async listRules(): Promise<KeywordRule[]> {
    const response = await apiClient.get<{ items?: KeywordRule[] }>("/inbox/keyword-rules");
    return response.data?.items ?? [];
  },

  async createRule(input: KeywordRuleInput): Promise<KeywordRule> {
    const response = await apiClient.post<KeywordRule>("/inbox/keyword-rules", input);
    return response.data!;
  },

  async updateRule(id: string, input: KeywordRuleInput): Promise<KeywordRule> {
    const response = await apiClient.patch<KeywordRule>(`/inbox/keyword-rules/${id}`, input);
    return response.data!;
  },

  async deleteRule(id: string): Promise<void> {
    await apiClient.delete(`/inbox/keyword-rules/${id}`);
  },
};
