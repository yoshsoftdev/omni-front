export type WhatsAppHeaderType = "none" | "text" | "image" | "video" | "document";

export type WhatsAppPreviewButton = {
  id: string;
  type: "url" | "phone_number" | "quick_reply" | "copy_code";
  text: string;
};

export type WhatsAppMessagePreviewProps = {
  heading?: string;
  deviceName: string;
  languageLabel: string;
  headerType?: WhatsAppHeaderType;
  headerText?: string;
  headerPreviewUrl?: string;
  body: string;
  footer?: string;
  buttons?: WhatsAppPreviewButton[];
  disclaimer?: string;
};
