import { parseTemplateDtoList } from "@/features/broadcast/boundary/template.boundary";
import type {
  CreateTemplatePayload,
  TemplateRepository,
} from "@/features/broadcast/repositories/template.repository";
import type { Template } from "@/features/broadcast/types/template";
import { templateService } from "@/features/broadcast/services/broadcast.service";
import type { TemplateDTO } from "@/types/broadcast";

type PageResponse<T> = {
  items?: T[];
  templates?: T[];
};

class ApiTemplateRepository implements TemplateRepository {
  async list(): Promise<Template[]> {
    const dtos = await templateService.list();
    return parseTemplateDtoList(dtos);
  }

  async getById(id: string): Promise<Template | undefined> {
    const templates = await this.list();
    return templates.find((template) => template.id === id);
  }

  async getByName(name: string): Promise<Template | undefined> {
    const templates = await this.list();
    return templates.find((template) => template.name === name);
  }

  async create(input: CreateTemplatePayload): Promise<Template> {
    const dto = await templateService.create({
      device_id: input.device_id ?? "",
      name: input.name,
      language: input.language,
      category: input.category,
      components: [],
    } as Parameters<typeof templateService.create>[0]);
    return parseTemplateDtoList([dto as TemplateDTO])[0];
  }

  async update(id: string, patch: Partial<Template>): Promise<Template> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Template not found: ${id}`);
    }
    return { ...existing, ...patch, id };
  }

  async sync(channelId: string): Promise<{ synced: number }> {
    return templateService.sync(channelId);
  }
}

export const templateRepositoryApi = new ApiTemplateRepository();
