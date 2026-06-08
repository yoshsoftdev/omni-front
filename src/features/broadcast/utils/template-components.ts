import type { WhatsAppHeaderType, WhatsAppPreviewButton } from "@/features/broadcast/types/whatsapp-preview";
import type { WhatsAppTemplate } from "@/types/broadcast";

type MetaComponent = {
  type?: string;
  format?: string;
  text?: string;
  buttons?: Array<{ type?: string; text?: string; url?: string }>;
};

export type ParsedTemplate = {
  body: string;
  footer?: string;
  headerType: WhatsAppHeaderType;
  buttons: WhatsAppPreviewButton[];
  variableCount: number;
};

function countVariables(text: string): number {
  const matches = text.match(/\{\{(\d+)\}\}/g) ?? [];
  const nums = matches.map((m) => Number(m.replace(/\D/g, "")));
  return nums.length > 0 ? Math.max(...nums) : 0;
}

function mapButtonType(type?: string): WhatsAppPreviewButton["type"] {
  const normalized = (type ?? "").toUpperCase();
  if (normalized === "URL") return "url";
  if (normalized === "COPY_CODE") return "copy_code";
  return "quick_reply";
}

export function parseTemplateComponents(template: WhatsAppTemplate): ParsedTemplate {
  const components = (Array.isArray(template.components) ? template.components : []) as MetaComponent[];
  let body = "";
  let footer: string | undefined;
  let headerType: WhatsAppHeaderType = "none";
  const buttons: WhatsAppPreviewButton[] = [];

  for (const component of components) {
    const type = (component.type ?? "").toUpperCase();
    if (type === "BODY" && component.text) {
      body = component.text;
    }
    if (type === "FOOTER" && component.text) {
      footer = component.text;
    }
    if (type === "HEADER") {
      const format = (component.format ?? "TEXT").toUpperCase();
      if (format === "IMAGE") headerType = "image";
      else if (format === "VIDEO") headerType = "video";
      else if (format === "DOCUMENT") headerType = "document";
    }
    if (type === "BUTTONS" && Array.isArray(component.buttons)) {
      component.buttons.forEach((btn, index) => {
        buttons.push({
          id: `btn_${index}`,
          type: mapButtonType(btn.type),
          text: btn.text ?? "Button",
        });
      });
    }
  }

  if (!body && template.preview) {
    body = template.preview;
  }

  return {
    body,
    footer,
    headerType,
    buttons,
    variableCount: countVariables(body),
  };
}

export function resolveContactFieldValue(
  field: string,
  contact?: { name: string; phone: string; email?: string | null; notes?: string | null },
): string {
  if (!contact) return "";
  switch (field) {
    case "name":
      return contact.name;
    case "phone":
      return contact.phone;
    case "email":
      return contact.email ?? "";
    case "notes":
      return contact.notes ?? "";
    default:
      return "";
  }
}
