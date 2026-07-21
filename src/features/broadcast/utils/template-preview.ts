import type { Template, TemplateHeaderType } from "@/features/broadcast/types/template";
import type { WhatsAppHeaderType } from "@/features/broadcast/types/whatsapp-preview";

export function countTemplateVariables(text?: string): number {
  if (!text?.trim()) return 0;
  const matches = text.match(/\{\{(\d+)\}\}/g) ?? [];
  if (matches.length === 0) return 0;
  return Math.max(...matches.map((match) => Number(match.replace(/\D/g, ""))));
}

export function templatePreviewHeaderType(headerType: TemplateHeaderType): WhatsAppHeaderType | undefined {
  if (headerType === "none") {
    return undefined;
  }
  return headerType as WhatsAppHeaderType;
}

export function resolveTemplatePreview(template: Template, sampleValues: Record<string, string> = {}): string {
  let body = template.body;
  Object.entries(sampleValues).forEach(([key, value]) => {
    body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  });
  return body;
}
