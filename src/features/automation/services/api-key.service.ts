import { getApiKeyRepository } from "@/features/automation/repositories/api-key.repository";
import type { CreateApiKeyInput } from "@/features/automation/types/api-key";

const repository = getApiKeyRepository();

export const apiKeyService = {
  list: () => repository.list(),
  create: (input: CreateApiKeyInput) => repository.create(input),
  rotate: (id: string) => repository.rotate(id),
  enable: (id: string) => repository.setStatus(id, "active"),
  disable: (id: string) => repository.setStatus(id, "disabled"),
  remove: (id: string) => repository.remove(id),
};
