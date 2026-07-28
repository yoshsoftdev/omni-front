import { MOCK_API_KEYS } from "@/features/automation/mock/mock-data";
import type { ApiKeyRepository } from "@/features/automation/repositories/api-key.repository";
import type {
  ApiKeySecretResult,
  AutomationApiKey,
  CreateApiKeyInput,
} from "@/features/automation/types/api-key";

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomSecret(): string {
  const tail = Math.random().toString(36).slice(2, 14);
  return `oc_auto_${tail}`;
}

class MockApiKeyRepository implements ApiKeyRepository {
  private keys: AutomationApiKey[] = structuredClone(MOCK_API_KEYS);

  async list() {
    await delay();
    return [...this.keys].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(input: CreateApiKeyInput): Promise<ApiKeySecretResult> {
    await delay(250);
    const secret = randomSecret();
    const key: AutomationApiKey = {
      id: `key_${Date.now()}`,
      name: input.name.trim(),
      keyPrefix: secret.slice(0, 12),
      scopes: input.scopes.length > 0 ? input.scopes : ["send_template"],
      status: "active",
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.keys = [key, ...this.keys];
    return { key, secret };
  }

  async rotate(id: string): Promise<ApiKeySecretResult> {
    await delay(250);
    const index = this.keys.findIndex((k) => k.id === id);
    if (index < 0) throw new Error("API key not found");
    const secret = randomSecret();
    const key: AutomationApiKey = {
      ...this.keys[index],
      keyPrefix: secret.slice(0, 12),
      status: "active",
    };
    this.keys[index] = key;
    return { key, secret };
  }

  async setStatus(id: string, status: "active" | "disabled") {
    await delay();
    const index = this.keys.findIndex((k) => k.id === id);
    if (index < 0) throw new Error("API key not found");
    this.keys[index] = { ...this.keys[index], status };
    return this.keys[index];
  }

  async remove(id: string) {
    await delay();
    this.keys = this.keys.filter((k) => k.id !== id);
  }
}

export const apiKeyRepositoryMock = new MockApiKeyRepository();
