import type { CreateTemplateForm, DetectedVariable } from "@/features/broadcast/types/create-template";

type MetaButton = {
  type: string;
  text: string;
  url?: string;
  example?: string[];
  otp_type?: string;
};

export function buildMetaTemplateComponents(
  form: CreateTemplateForm,
  variables: DetectedVariable[],
): unknown[] {
  const components: unknown[] = [];

  if (form.headerType === "image" || form.headerType === "video" || form.headerType === "document") {
    throw new Error(
      "Header gambar/video/dokumen memerlukan upload media ke Meta. Gunakan header None untuk submit via API.",
    );
  }

  const bodyExamples = variables.length > 0 ? [variables.map((v) => v.sampleValue)] : undefined;
  const bodyComponent: Record<string, unknown> = {
    type: "BODY",
    text: form.body.trim(),
  };
  if (bodyExamples) {
    bodyComponent.example = { body_text: bodyExamples };
  }
  components.push(bodyComponent);

  if (form.footer.trim()) {
    components.push({
      type: "FOOTER",
      text: form.footer.trim(),
    });
  }

  if (form.buttons.length > 0) {
    const buttons: MetaButton[] = form.buttons.map((button) => {
      const text = button.text.trim();
      if (button.type === "url") {
        const url = button.url?.trim() ?? "";
        const metaButton: MetaButton = {
          type: "URL",
          text,
          url,
        };
        if (url.includes("{{")) {
          metaButton.example = [url.replace(/\{\{\d+\}\}/g, "demo")];
        }
        return metaButton;
      }
      if (button.type === "copy_code") {
        return {
          type: "OTP",
          text,
          otp_type: "COPY_CODE",
        };
      }
      return {
        type: "QUICK_REPLY",
        text,
      };
    });

    components.push({
      type: "BUTTONS",
      buttons,
    });
  }

  return components;
}

export type CreateTemplatePayload = {
  device_id: string;
  name: string;
  language: string;
  category: string;
  components: unknown[];
};

export function buildCreateTemplatePayload(
  form: CreateTemplateForm,
  variables: DetectedVariable[],
): CreateTemplatePayload {
  if (!form.deviceId) {
    throw new Error("Pilih WABA / device terlebih dahulu.");
  }

  return {
    device_id: form.deviceId,
    name: form.name,
    language: form.language,
    category: form.category,
    components: buildMetaTemplateComponents(form, variables),
  };
}
