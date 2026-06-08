"use client";

import { WhatsAppMessagePreview } from "@/features/broadcast/components/shared/whatsapp-message-preview";
import type { WhatsAppHeaderType, WhatsAppPreviewButton } from "@/features/broadcast/types/whatsapp-preview";

function buildPreviewBody(body: string, mapping: Record<string, string>) {
  return body.replace(/\{\{(\d+)\}\}/g, (_match, key: string) => mapping[key] ?? "");
}

export function LiveWhatsAppPreview({
  body,
  footer,
  headerType = "none",
  buttons = [],
  language,
  deviceName,
  mappingValuesForPreview,
}: {
  body: string;
  footer?: string;
  headerType?: WhatsAppHeaderType;
  buttons?: WhatsAppPreviewButton[];
  language: string;
  deviceName: string;
  mappingValuesForPreview: Record<string, string>;
}) {
  const previewBody = buildPreviewBody(body, mappingValuesForPreview);

  return (
    <WhatsAppMessagePreview
      heading="Preview Pesan"
      deviceName={deviceName}
      languageLabel={language}
      headerType={headerType}
      body={previewBody}
      footer={footer}
      buttons={buttons}
      disclaimer="Preview hanya contoh. Pesan akan dikirim ke banyak kontak sesuai audiens."
    />
  );
}
