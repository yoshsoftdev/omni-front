/**
 * Official Template domain boundary.
 *
 * All TemplateDTO data must pass through this module before reaching UI layers.
 * Mock data uses native Template objects from template-mock-data.ts.
 * API integration (future) must use parseTemplateDto / serializeTemplate here.
 */
import {
  mapTemplateDtoToTemplate,
  mapTemplateToTemplateDto,
} from "@/features/broadcast/mappers/template.mapper";
import type { Template } from "@/features/broadcast/types/template";
import type { TemplateDTO } from "@/types/broadcast";

export function parseTemplateDto(dto: TemplateDTO): Template {
  const template = mapTemplateDtoToTemplate(dto);
  return assertDomainTemplate(template);
}

export function parseTemplateDtoList(dtos: TemplateDTO[]): Template[] {
  return dtos.map(parseTemplateDto);
}

export function serializeTemplate(template: Template): TemplateDTO {
  return mapTemplateToTemplateDto(template);
}

export function assertDomainTemplate(template: Template): Template {
  if (!template.id.trim()) {
    throw new Error("Template domain boundary violation: id is required");
  }
  if (!template.name.trim()) {
    throw new Error("Template domain boundary violation: name is required");
  }
  if (!template.body.trim()) {
    throw new Error("Template domain boundary violation: body is required");
  }
  return template;
}

export function assertDomainTemplateList(templates: Template[]): Template[] {
  return templates.map(assertDomainTemplate);
}

export { mapTemplateDtoToTemplate, mapTemplateToTemplateDto };

export type { TemplateDTO, Template };

/*
 * Future: template.repository.api.ts (sole consumer of boundary + mapper)
 *
 *   async list(): Promise<Template[]> {
 *     const dtos = await apiClient.get<{ templates: TemplateDTO[] }>("/templates");
 *     return parseTemplateDtoList(dtos.data?.templates ?? []);
 *   }
 *
 * UI pages import Template only — never TemplateDTO.
 */
