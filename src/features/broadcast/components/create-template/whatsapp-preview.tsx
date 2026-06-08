"use client";

import { WhatsAppMessagePreview } from "@/features/broadcast/components/shared/whatsapp-message-preview";
import type { CreateTemplateForm } from "@/features/broadcast/types/create-template";
import type { DetectedVariable } from "@/features/broadcast/types/create-template";
import { getLanguageLabel, renderPreviewBody } from "@/features/broadcast/utils/create-template.utils";

type WhatsAppPreviewProps = {
  form: CreateTemplateForm;
  variables: DetectedVariable[];
};

export function WhatsAppPreview({ form, variables }: WhatsAppPreviewProps) {
  return (
    <WhatsAppMessagePreview
      deviceName="Skinsure Glow Official"
      languageLabel={getLanguageLabel(form.language)}
      headerType={form.headerType}
      body={renderPreviewBody(form.body, variables)}
      footer={form.footer || undefined}
      buttons={form.buttons}
    />
  );
}
