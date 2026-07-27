import {
  getTemplateRepository,
  type TemplateListPage,
  type TemplateListQuery,
} from "@/features/broadcast/repositories/template.repository";
import type { Template } from "@/features/broadcast/types/template";

const repository = getTemplateRepository();

export type { TemplateListPage, TemplateListQuery };

/**
 * Template Query Service — server-side search/pagination façade.
 * UI must not filter or page template lists locally.
 */
export const templateQueryService = {
  async getTemplatesPage(query?: TemplateListQuery): Promise<TemplateListPage> {
    return repository.listPage(query);
  },

  async getTemplates(query?: TemplateListQuery): Promise<Template[]> {
    return repository.list(query);
  },

  async getTemplateById(id: string): Promise<Template | undefined> {
    return repository.getById(id);
  },

  async getTemplateByName(name: string): Promise<Template | undefined> {
    return repository.getByName(name);
  },

  async syncTemplates(deviceId: string): Promise<{ synced: number }> {
    return repository.sync(deviceId);
  },
};
