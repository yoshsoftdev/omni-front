import { parseTemplateDtoList } from "@/features/broadcast/boundary/template.boundary";
import type {
  CreateTemplatePayload,
  TemplateListPage,
  TemplateListQuery,
  TemplateRepository,
} from "@/features/broadcast/repositories/template.repository";
import type { Template } from "@/features/broadcast/types/template";
import { templateService } from "@/features/broadcast/services/broadcast.service";
import type { TemplateDTO } from "@/types/broadcast";

class ApiTemplateRepository implements TemplateRepository {
  async listPage(query?: TemplateListQuery): Promise<TemplateListPage> {
    const result = await templateService.listPage({
      channel_id: query?.channelId,
      status: query?.status,
      search: query?.search,
      language: query?.language,
      category: query?.category,
      page: query?.page,
      page_size: query?.pageSize,
    });
    return {
      items: parseTemplateDtoList(result.items),
      pagination: result.pagination,
    };
  }

  async list(query?: TemplateListQuery): Promise<Template[]> {
    const page = await this.listPage({
      ...query,
      page: query?.page ?? 1,
      pageSize: query?.pageSize ?? 100,
    });
    return page.items;
  }

  async getById(id: string): Promise<Template | undefined> {
    try {
      const dto = await templateService.get(id);
      return parseTemplateDtoList([dto as TemplateDTO])[0];
    } catch {
      return undefined;
    }
  }

  async getByName(name: string): Promise<Template | undefined> {
    const page = await this.listPage({ search: name, pageSize: 100 });
    return page.items.find((template) => template.name === name);
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
