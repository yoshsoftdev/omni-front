import type {
  Template,
  TemplateButton,
  TemplateButtonType,
  TemplateCategory,
  TemplateHeader,
  TemplateStatus,
} from "@/features/broadcast/types/template";
import type {
  TemplateComponentButtonDTO,
  TemplateComponentDTO,
  TemplateDTO,
} from "@/types/broadcast";

const LANGUAGE_LABELS: Record<string, string> = {
  id: "Indonesia (ID)",
  id_ID: "Indonesia (ID)",
  en: "English (EN)",
  en_US: "English (EN)",
};

function formatLanguageLabel(language: string): string {
  if (language.includes("(")) {
    return language;
  }
  return LANGUAGE_LABELS[language] ?? language;
}

function normalizeCategory(category?: string): TemplateCategory {
  const value = (category ?? "Utility").trim();
  if (value === "Marketing" || value === "Authentication") {
    return value;
  }
  return "Utility";
}

function normalizeStatus(status?: string): TemplateStatus {
  const value = (status ?? "APPROVED").toUpperCase();
  if (value === "PENDING" || value === "REJECTED") {
    return value;
  }
  return "APPROVED";
}

function countVariables(text: string): number {
  const matches = text.match(/\{\{(\d+)\}\}/g) ?? [];
  const nums = matches.map((match) => Number(match.replace(/\D/g, "")));
  return nums.length > 0 ? Math.max(...nums) : 0;
}

function mapButtonType(type?: string): TemplateButtonType {
  const normalized = (type ?? "").toUpperCase();
  if (normalized === "URL") return "url";
  if (normalized === "COPY_CODE" || normalized === "OTP") return "copy_code";
  return "quick_reply";
}

function buildPreview(body: string, preview?: string): string {
  if (preview?.trim()) {
    return preview;
  }
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 80) {
    return trimmed;
  }
  return `${trimmed.slice(0, 77)}...`;
}

function parseHeader(component: Extract<TemplateComponentDTO, { type: "HEADER" }>): TemplateHeader {
  const format = (component.format ?? "TEXT").toUpperCase();
  if (format === "IMAGE") {
    return { type: "image", title: component.text };
  }
  if (format === "VIDEO") {
    return { type: "video", title: component.text };
  }
  if (format === "DOCUMENT") {
    return { type: "document", title: component.text };
  }
  if (component.text?.trim()) {
    return { type: "none", title: component.text };
  }
  return { type: "none" };
}

function mapButtons(buttons: TemplateComponentButtonDTO[]): TemplateButton[] {
  return buttons.map((button, index) => ({
    id: `btn_${index + 1}`,
    type: mapButtonType(button.type),
    text: button.text,
    url: button.url,
    code: button.otp_type,
  }));
}

function parseComponents(components: TemplateComponentDTO[]): Pick<
  Template,
  "header" | "body" | "footer" | "buttons" | "variable_count"
> {
  let body = "";
  let footer: string | undefined;
  let header: TemplateHeader = { type: "none" };
  const buttons: TemplateButton[] = [];

  for (const component of components) {
    if (component.type === "BODY") {
      body = component.text;
      continue;
    }
    if (component.type === "FOOTER") {
      footer = component.text;
      continue;
    }
    if (component.type === "HEADER") {
      header = parseHeader(component);
      continue;
    }
    if (component.type === "BUTTONS") {
      buttons.push(...mapButtons(component.buttons));
    }
  }

  return {
    header,
    body,
    footer,
    buttons,
    variable_count: countVariables(body),
  };
}

export function mapTemplateDtoToTemplate(dto: TemplateDTO): Template {
  const parsed = parseComponents(dto.components);

  return {
    id: dto.id,
    name: dto.name,
    language: dto.language,
    language_label: formatLanguageLabel(dto.language),
    category: normalizeCategory(dto.category),
    status: normalizeStatus(dto.status),
    preview: buildPreview(parsed.body, dto.preview),
    header: parsed.header,
    body: parsed.body,
    footer: parsed.footer,
    buttons: parsed.buttons,
    variable_count: parsed.variable_count,
    device_id: dto.device_id,
    waba_id: dto.waba_id,
    meta_template_id: dto.meta_template_id,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
    last_sync_at: dto.updated_at,
  };
}

function serializeHeader(header: TemplateHeader): TemplateComponentDTO | null {
  if (header.type === "none" && !header.title?.trim()) {
    return null;
  }
  if (header.type === "image") {
    return { type: "HEADER", format: "IMAGE", text: header.title };
  }
  if (header.type === "video") {
    return { type: "HEADER", format: "VIDEO", text: header.title };
  }
  if (header.type === "document") {
    return { type: "HEADER", format: "DOCUMENT", text: header.title };
  }
  return { type: "HEADER", format: "TEXT", text: header.title };
}

function serializeButtons(buttons: TemplateButton[]): TemplateComponentDTO | null {
  if (buttons.length === 0) {
    return null;
  }
  return {
    type: "BUTTONS",
    buttons: buttons.map((button) => ({
      type:
        button.type === "url"
          ? "URL"
          : button.type === "copy_code"
            ? "COPY_CODE"
            : "QUICK_REPLY",
      text: button.text,
      url: button.url,
    })),
  };
}

export function mapTemplateToTemplateDto(template: Template): TemplateDTO {
  const components: TemplateComponentDTO[] = [];
  const header = serializeHeader(template.header);
  if (header) {
    components.push(header);
  }
  components.push({ type: "BODY", text: template.body });
  if (template.footer?.trim()) {
    components.push({ type: "FOOTER", text: template.footer });
  }
  const buttons = serializeButtons(template.buttons);
  if (buttons) {
    components.push(buttons);
  }

  return {
    id: template.id,
    device_id: template.device_id ?? "",
    waba_id: template.waba_id ?? "",
    meta_template_id: template.meta_template_id ?? template.id,
    name: template.name,
    language: template.language,
    category: template.category,
    status: template.status,
    preview: template.preview,
    components,
    created_at: template.created_at ?? new Date(0).toISOString(),
    updated_at: template.updated_at ?? template.last_sync_at ?? new Date(0).toISOString(),
  };
}

export {
  countVariables,
  formatLanguageLabel,
  normalizeCategory,
  normalizeStatus,
  buildPreview,
};
