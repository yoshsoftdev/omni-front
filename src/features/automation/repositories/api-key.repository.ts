import { apiKeyRepositoryApi } from "@/features/automation/repositories/api-key.repository.api";
import type {
  ApiKeyScope,
  ApiKeySecretResult,
  AutomationApiKey,
  CreateApiKeyInput,
} from "@/features/automation/types/api-key";

export interface ApiKeyRepository {
  list(): Promise<AutomationApiKey[]>;
  create(input: CreateApiKeyInput): Promise<ApiKeySecretResult>;
  rotate(id: string): Promise<ApiKeySecretResult>;
  setStatus(id: string, status: "active" | "disabled"): Promise<AutomationApiKey>;
  remove(id: string): Promise<void>;
}

export function getApiKeyRepository(): ApiKeyRepository {
  return apiKeyRepositoryApi;
}

export type { ApiKeyScope };
