import type { CreateTemplateForm, TemplateButton } from "@/features/broadcast/types/create-template";

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

export const defaultTemplateButtons: TemplateButton[] = [
  { id: "btn_1", type: "url", text: "Belanja Sekarang", url: "https://skinsure.id/shop" },
  { id: "btn_2", type: "quick_reply", text: "Hubungi Kami" },
];

export const defaultCreateTemplateForm: CreateTemplateForm = {
  deviceId: "",
  name: "promo_hydrabalance_apr2024",
  language: "id",
  category: "marketing",
  headerType: "none",
  headerFileName: undefined,
  body: `Halo {{1}} 👋

Dapatkan diskon {{2}}% untuk semua produk Hydrabalance Moisturizer.

Berlaku sampai {{3}}.

Terima kasih telah menjadi pelanggan setia kami.`,
  footer: "",
  buttons: defaultTemplateButtons,
};

export const variableSampleValues: Record<string, string> = {
  "1": "John Doe",
  "2": "20",
  "3": "30 April 2024",
};

export const variableFieldLabels: Record<string, string> = {
  "1": "name",
  "2": "discount",
  "3": "expired_date",
};
