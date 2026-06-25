import {
  getTemplateRepository,
  type TemplateListQuery,
} from "@/features/broadcast/repositories/template.repository";
import type { Template } from "@/features/broadcast/types/template";

const repository = getTemplateRepository();

export type { TemplateListQuery };

/**
 * Template read façade for UI pages.
 * Delegates to TemplateRepository — never imports mock data directly.
 */
export const templateQueryService = {
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
