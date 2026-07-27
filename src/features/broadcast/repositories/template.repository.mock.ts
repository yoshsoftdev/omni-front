import { MOCK_TEMPLATES } from "@/features/broadcast/mock/template-mock-data";
import type {
  CreateTemplatePayload,
  TemplateListPage,
  TemplateListQuery,
  TemplateRepository,
} from "@/features/broadcast/repositories/template.repository";
import type { Template } from "@/features/broadcast/types/template";

/**
 * Mock template repository — sole consumer of template-mock-data.ts.
 */
class MockTemplateRepository implements TemplateRepository {
  private templates: Template[] = MOCK_TEMPLATES.map((template) => ({ ...template }));

  async listPage(query?: TemplateListQuery): Promise<TemplateListPage> {
    let items = this.templates.map((template) => ({ ...template }));
    if (query?.channelId) {
      items = items.filter((item) => item.device_id === query.channelId || !item.device_id);
    }
    if (query?.status && query.status !== "all") {
      items = items.filter((item) => item.status === query.status);
    }
    if (query?.language && query.language !== "all") {
      const lang = query.language.toLowerCase();
      items = items.filter(
        (item) =>
          item.language.toLowerCase() === lang ||
          item.language.toLowerCase().startsWith(`${lang}_`) ||
          (lang === "en" && item.language.toLowerCase().startsWith("en")),
      );
    }
    if (query?.category && query.category !== "all") {
      items = items.filter(
        (item) => item.category.toLowerCase() === query.category!.toLowerCase(),
      );
    }
    if (query?.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.preview ?? "").toLowerCase().includes(q),
      );
    }
    const pageSize = query?.pageSize ?? 20;
    const page = query?.page ?? 1;
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      pagination: {
        page: safePage,
        page_size: pageSize,
        total,
        total_pages: totalPages,
      },
    };
  }

  async list(query?: TemplateListQuery): Promise<Template[]> {
    const page = await this.listPage({ ...query, page: 1, pageSize: query?.pageSize ?? 100 });
    return page.items;
  }

  async getById(id: string): Promise<Template | undefined> {
    const template = this.templates.find((item) => item.id === id);
    return template ? { ...template } : undefined;
  }

  async getByName(name: string): Promise<Template | undefined> {
    const template = this.templates.find((item) => item.name === name);
    return template ? { ...template } : undefined;
  }

  async create(input: CreateTemplatePayload): Promise<Template> {
    const now = new Date().toISOString();
    const template: Template = {
      ...input,
      id: `tpl_${Date.now()}`,
      created_at: now,
      updated_at: now,
      last_sync_at: now,
    };
    this.templates = [template, ...this.templates];
    return { ...template };
  }

  async update(id: string, patch: Partial<Template>): Promise<Template> {
    const index = this.templates.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Template not found: ${id}`);
    }
    const updated: Template = {
      ...this.templates[index],
      ...patch,
      id,
      updated_at: new Date().toISOString(),
    };
    this.templates[index] = updated;
    return { ...updated };
  }

  async sync(deviceId: string): Promise<{ synced: number }> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const now = new Date().toISOString();
    this.templates = this.templates.map((template) =>
      template.device_id === deviceId || !template.device_id
        ? { ...template, last_sync_at: now, updated_at: now }
        : template,
    );
    return { synced: this.templates.length };
  }
}

export const templateRepositoryMock = new MockTemplateRepository();
