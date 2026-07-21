"use client";

import { WhatsAppMessagePreview } from "@/features/broadcast/components/shared/whatsapp-message-preview";
import type { CreateTemplateForm, DetectedVariable } from "@/features/broadcast/types/create-template";
import { getLanguageLabel, renderPreviewBody } from "@/features/broadcast/utils/create-template.utils";

type WhatsAppPreviewProps = {
  form: CreateTemplateForm;
  variables: DetectedVariable[];
  deviceName: string;
};

export function WhatsAppPreview({ form, variables, deviceName }: WhatsAppPreviewProps) {
  return (
    <WhatsAppMessagePreview
      deviceName={deviceName}
      languageLabel={getLanguageLabel(form.language)}
      headerType={form.headerType}
      headerText={form.headerText}
      headerPreviewUrl={form.headerPreviewUrl}
      body={renderPreviewBody(form.body, variables)}
      footer={form.footer || undefined}
      buttons={form.buttons}
    />
  );
}
