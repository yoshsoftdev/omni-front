/**
 * Legacy adapters — keep existing UI imports working until page migration.
 * Derives WhatsAppTemplateMock and TemplateListItem from unified Template domain.
 */
import type { Template } from "@/features/broadcast/types/template";
import type { WhatsAppHeaderType, WhatsAppPreviewButton } from "@/features/broadcast/types/whatsapp-preview";

export type TemplateStatus = "APPROVED" | "PENDING" | "REJECTED";

export type WhatsAppTemplateMock = {
  id: string;
  name: string;
  language: string;
  category: string;
  status: TemplateStatus;
  headerTitle: string;
  headerType?: WhatsAppHeaderType;
  body: string;
  footer?: string;
  buttons?: WhatsAppPreviewButton[];
  variableCount: number;
};

export type TemplateListItem = {
  id: string;
  name: string;
  preview: string;
  language: string;
  category: string;
  status: TemplateStatus;
  lastSyncAt: string;
};

function mapHeaderType(type: Template["header"]["type"]): WhatsAppHeaderType | undefined {
  if (type === "none") {
    return undefined;
  }
  return type;
}

export function toWhatsAppTemplateMock(template: Template): WhatsAppTemplateMock {
  return {
    id: template.id,
    name: template.name,
    language: template.language_label,
    category: template.category,
    status: template.status,
    headerTitle: template.header.title ?? "",
    headerType: mapHeaderType(template.header.type),
    body: template.body,
    footer: template.footer,
    buttons: template.buttons.map((button) => ({
      id: button.id,
      type: button.type,
      text: button.text,
      url: button.url,
    })),
    variableCount: template.variable_count,
  };
}

export function toTemplateListItem(template: Template): TemplateListItem {
  return {
    id: template.id,
    name: template.name,
    preview: template.preview,
    language: template.language_label,
    category: template.category,
    status: template.status,
    lastSyncAt: template.last_sync_at ?? template.updated_at ?? "",
  };
}
