export type HeaderType = "none" | "text" | "image" | "video" | "document";

export type TemplateButtonType = "url" | "phone_number" | "quick_reply" | "copy_code";

/** Meta WhatsApp Manager button groups: CTA and Quick Reply cannot mix. */
export type TemplateButtonMode = "none" | "cta" | "quick_reply";

export type TemplateButton = {
  id: string;
  type: TemplateButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
  code?: string;
};

export type CreateTemplateForm = {
  deviceId: string;
  name: string;
  language: string;
  category: string;
  headerType: HeaderType;
  headerText?: string;
  headerFileName?: string;
  headerObjectId?: string;
  headerPreviewUrl?: string;
  body: string;
  footer: string;
  buttonMode: TemplateButtonMode;
  buttons: TemplateButton[];
};

export type DetectedVariable = {
  key: string;
  placeholder: string;
  sampleValue: string;
  fieldLabel: string;
};
