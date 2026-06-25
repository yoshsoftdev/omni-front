import type { TemplateButton } from "@/features/broadcast/types/create-template";

export const createTemplateLanguageOptions = [
  { value: "id", label: "Indonesian (ID)" },
  { value: "en", label: "English (EN)" },
];

export const createTemplateCategoryOptions = [
  { value: "marketing", label: "Marketing" },
  { value: "utility", label: "Utility" },
  { value: "authentication", label: "Authentication" },
];

export const headerTypeOptions = [
  { value: "none", label: "None" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
] as const;

export const defaultTemplateButtons: TemplateButton[] = [];
