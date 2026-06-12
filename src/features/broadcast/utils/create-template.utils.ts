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
  contact?: Pick<Contact, "name" | "phone" | "email" | "notes">,
): DetectedVariable[] {
  if (!contact) return variables;

  const samples = [contact.name, contact.phone, contact.email ?? "", contact.notes ?? ""].filter(
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

export function validateCreateTemplateForm(form: CreateTemplateForm): string | null {
  if (!form.deviceId) {
    return "Pilih WABA / device terlebih dahulu.";
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
  if (form.headerType === "image" || form.headerType === "video" || form.headerType === "document") {
    return "Header media belum didukung untuk submit API. Pilih header None.";
  }
  if (form.buttons.length > 3) {
    return "Maksimal 3 tombol per template.";
  }
  for (const button of form.buttons) {
    if (!button.text.trim()) {
      return "Semua tombol harus memiliki teks.";
    }
    if (button.type === "url" && !button.url?.trim()) {
      return "URL Button memerlukan URL.";
    }
    if (button.type === "copy_code" && !button.code?.trim()) {
      return "Copy Code Button memerlukan kode.";
    }
  }
  return null;
}
