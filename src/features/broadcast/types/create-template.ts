export type HeaderType = "none" | "image" | "video" | "document";

export type TemplateButtonType = "url" | "quick_reply" | "copy_code";

export type TemplateButton = {
  id: string;
  type: TemplateButtonType;
  text: string;
  url?: string;
  code?: string;
};

export type CreateTemplateForm = {
  deviceId: string;
  name: string;
  language: string;
  category: string;
  headerType: HeaderType;
  headerFileName?: string;
  body: string;
  footer: string;
  buttons: TemplateButton[];
};

export type DetectedVariable = {
  key: string;
  placeholder: string;
  sampleValue: string;
  fieldLabel: string;
};
