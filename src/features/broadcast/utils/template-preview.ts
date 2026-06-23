import type { Template, TemplateHeaderType } from "@/features/broadcast/types/template";
import type { WhatsAppHeaderType } from "@/features/broadcast/types/whatsapp-preview";

export function templatePreviewHeaderType(headerType: TemplateHeaderType): WhatsAppHeaderType | undefined {
  if (headerType === "none") {
    return undefined;
  }
  return headerType;
}

export function resolveTemplatePreview(template: Template, sampleValues: Record<string, string> = {}): string {
  let body = template.body;
  Object.entries(sampleValues).forEach(([key, value]) => {
    body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  });
  return body;
}
