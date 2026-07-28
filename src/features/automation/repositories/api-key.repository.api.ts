import { apiClient } from "@/services/api/client";
import type { ApiKeyRepository } from "@/features/automation/repositories/api-key.repository";
import type {
  ApiKeySecretResult,
  AutomationApiKey,
  CreateApiKeyInput,
} from "@/features/automation/types/api-key";

class ApiApiKeyRepository implements ApiKeyRepository {
  async list(): Promise<AutomationApiKey[]> {
    const res = await apiClient.get<AutomationApiKey[]>("/automation/keys");
    return (res.data as AutomationApiKey[]) ?? [];
  }

  async create(input: CreateApiKeyInput): Promise<ApiKeySecretResult> {
    const res = await apiClient.post<ApiKeySecretResult>("/automation/keys", input);
    return res.data as ApiKeySecretResult;
  }

  async rotate(id: string): Promise<ApiKeySecretResult> {
    const res = await apiClient.post<ApiKeySecretResult>(`/automation/keys/${id}/rotate`);
    return res.data as ApiKeySecretResult;
  }

  async setStatus(id: string, status: "active" | "disabled"): Promise<AutomationApiKey> {
    const path = status === "active" ? `/automation/keys/${id}/enable` : `/automation/keys/${id}/disable`;
    const res = await apiClient.post<AutomationApiKey>(path);
    return res.data as AutomationApiKey;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/automation/keys/${id}`);
  }
}

export const apiKeyRepositoryApi = new ApiApiKeyRepository();
