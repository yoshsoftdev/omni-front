import { templateRepositoryApi } from "@/features/broadcast/repositories/template.repository.api";
import type { Template } from "@/features/broadcast/types/template";

export type CreateTemplatePayload = Omit<Template, "id" | "created_at" | "updated_at" | "last_sync_at">;

export type TemplateListQuery = {
  channelId?: string;
  status?: string;
  search?: string;
  language?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};

export type TemplateListPage = {
  items: Template[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

export interface TemplateRepository {
  list(query?: TemplateListQuery): Promise<Template[]>;
  listPage(query?: TemplateListQuery): Promise<TemplateListPage>;
  getById(id: string): Promise<Template | undefined>;
  getByName(name: string): Promise<Template | undefined>;
  create(input: CreateTemplatePayload): Promise<Template>;
  update(id: string, patch: Partial<Template>): Promise<Template>;
  sync(deviceId: string): Promise<{ synced: number }>;
}

export function getTemplateRepository(): TemplateRepository {
  return templateRepositoryApi;
}
