import type {
  TemplateButton,
  TemplateButtonMode,
} from "@/features/broadcast/types/create-template";

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
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
] as const;

export const buttonModeOptions: { value: TemplateButtonMode; label: string; hint: string }[] = [
  { value: "none", label: "None", hint: "Tanpa tombol" },
  {
    value: "cta",
    label: "Call to action",
    hint: "URL website atau telepon (maks. 2)",
  },
  {
    value: "quick_reply",
    label: "Quick reply",
    hint: "Balasan cepat (maks. 3)",
  },
];

export const defaultTemplateButtons: TemplateButton[] = [];

export const HEADER_MEDIA_ACCEPT: Record<"image" | "video" | "document", string> = {
  image: "image/jpeg,image/png",
  video: "video/mp4",
  document: "application/pdf",
};

export const HEADER_MEDIA_MAX_BYTES: Record<"image" | "video" | "document", number> = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  document: 100 * 1024 * 1024,
};
