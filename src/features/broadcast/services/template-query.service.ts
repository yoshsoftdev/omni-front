import { getTemplateRepository } from "@/features/broadcast/repositories/template.repository";
import type { Template } from "@/features/broadcast/types/template";

const repository = getTemplateRepository();

/**
 * Template read façade for UI pages.
 * Delegates to TemplateRepository — never imports mock data directly.
 */
export const templateQueryService = {
  async getTemplates(): Promise<Template[]> {
    return repository.list();
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
