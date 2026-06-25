import { templateRepositoryApi } from "@/features/broadcast/repositories/template.repository.api";
import type { Template } from "@/features/broadcast/types/template";

export type CreateTemplatePayload = Omit<Template, "id" | "created_at" | "updated_at" | "last_sync_at">;

export interface TemplateRepository {
  list(): Promise<Template[]>;
  getById(id: string): Promise<Template | undefined>;
  getByName(name: string): Promise<Template | undefined>;
  create(input: CreateTemplatePayload): Promise<Template>;
  update(id: string, patch: Partial<Template>): Promise<Template>;
  sync(deviceId: string): Promise<{ synced: number }>;
}

export function getTemplateRepository(): TemplateRepository {
  return templateRepositoryApi;
}
