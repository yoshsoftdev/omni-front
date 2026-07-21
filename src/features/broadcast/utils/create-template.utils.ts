import type { CreateTemplateForm, DetectedVariable } from "@/features/broadcast/types/create-template";
import type { Contact } from "@/types/contact";

const NAME_PATTERN = /^[a-z0-9_]*$/;

export function sanitizeTemplateName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 512);
}

export function isValidTemplateName(name: string): boolean {
  return name.length > 0 && NAME_PATTERN.test(name) && name.length <= 512;
}

export function detectVariables(body: string): DetectedVariable[] {
  const matches = body.match(/\{\{(\d+)\}\}/g) ?? [];
  const uniqueKeys = [...new Set(matches.map((m) => m.replace(/\D/g, "")))].sort(
    (a, b) => Number(a) - Number(b),
  );

  const fieldLabels = ["name", "phone", "email", "notes"];
  return uniqueKeys.map((key, index) => ({
    key,
    placeholder: `{{${key}}}`,
    sampleValue: `Value ${key}`,
    fieldLabel: fieldLabels[index] ?? `field_${key}`,
  }));
}

export function applyContactSamples(
  variables: DetectedVariable[],
  contact?: Pick<Contact, "contact_name" | "customer_name" | "phone" | "email" | "notes">,
): DetectedVariable[] {
  if (!contact) return variables;

  const samples = [contact.customer_name, contact.contact_name, contact.phone, contact.email ?? "", contact.notes ?? ""].filter(
    (value) => String(value).trim().length > 0,
  );

  return variables.map((variable, index) => ({
    ...variable,
    sampleValue: samples[index] ?? variable.sampleValue,
  }));
}

export function renderPreviewBody(body: string, variables: DetectedVariable[]): string {
  let result = body;
  for (const variable of variables) {
    result = result.split(variable.placeholder).join(variable.sampleValue);
  }
  return result;
}

export function getLanguageLabel(language: string): string {
  if (language === "id") return "Indonesian (ID)";
  if (language === "en") return "English (EN)";
  return language;
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    marketing: "Marketing",
    utility: "Utility",
    authentication: "Authentication",
  };
  return labels[category] ?? category;
}

export function isMediaHeader(type: CreateTemplateForm["headerType"]): type is "image" | "video" | "document" {
  return type === "image" || type === "video" || type === "document";
}

export function validateCreateTemplateForm(form: CreateTemplateForm): string | null {
  if (!form.deviceId) {
    return "Pilih channel WhatsApp (WABA) terlebih dahulu.";
  }
  if (!isValidTemplateName(form.name)) {
    return "Nama template harus huruf kecil, angka, dan underscore (maks. 512 karakter).";
  }
  if (!form.body.trim()) {
    return "Body template wajib diisi.";
  }
  if (form.body.length > 1024) {
    return "Body template maksimal 1024 karakter.";
  }
  if (form.footer.length > 60) {
    return "Footer maksimal 60 karakter.";
  }
  if (form.headerType === "text" && !form.headerText?.trim()) {
    return "Header teks wajib diisi.";
  }
  if (form.headerType === "text" && (form.headerText?.length ?? 0) > 60) {
    return "Header teks maksimal 60 karakter.";
  }
  if (isMediaHeader(form.headerType) && !form.headerObjectId) {
    return "Unggah media header ke storage terlebih dahulu.";
  }

  const maxButtons = form.buttonMode === "cta" ? 2 : 3;
  if (form.buttonMode === "none" && form.buttons.length > 0) {
    return "Mode tombol None tidak boleh memiliki tombol.";
  }
  if (form.buttonMode !== "none" && form.buttons.length === 0) {
    return "Tambahkan minimal satu tombol, atau pilih None.";
  }
  if (form.buttons.length > maxButtons) {
    return form.buttonMode === "cta"
      ? "Call to action maksimal 2 tombol."
      : "Quick reply maksimal 3 tombol.";
  }

  for (const button of form.buttons) {
    if (!button.text.trim()) {
      return "Semua tombol harus memiliki teks.";
    }
    if (form.buttonMode === "cta" && button.type !== "url" && button.type !== "phone_number") {
      return "Call to action hanya mendukung URL atau nomor telepon.";
    }
    if (form.buttonMode === "quick_reply" && button.type !== "quick_reply") {
      return "Mode Quick reply hanya mendukung tombol quick reply.";
    }
    if (button.type === "url" && !button.url?.trim()) {
      return "Tombol URL memerlukan alamat website.";
    }
    if (button.type === "phone_number" && !button.phoneNumber?.trim()) {
      return "Tombol telepon memerlukan nomor.";
    }
    if (button.type === "copy_code" && !button.code?.trim()) {
      return "Copy Code Button memerlukan kode.";
    }
  }
  return null;
}
