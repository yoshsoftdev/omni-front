import { MOCK_TEMPLATES } from "@/features/broadcast/mock/template-mock-data";
import type {
  CreateTemplatePayload,
  TemplateRepository,
} from "@/features/broadcast/repositories/template.repository";
import type { Template } from "@/features/broadcast/types/template";

/**
 * Mock template repository — sole consumer of template-mock-data.ts.
 * Templates are native domain objects; boundary/mapper are not used here.
 * Future template.repository.api.ts will use template.boundary.ts for DTO conversion.
 */
class MockTemplateRepository implements TemplateRepository {
  private templates: Template[] = MOCK_TEMPLATES.map((template) => ({ ...template }));

  async list(): Promise<Template[]> {
    return this.templates.map((template) => ({ ...template }));
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
