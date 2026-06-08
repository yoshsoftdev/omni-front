export type WhatsAppHeaderType = "none" | "image" | "video" | "document";

export type WhatsAppPreviewButton = {
  id: string;
  type: "url" | "quick_reply" | "copy_code";
  text: string;
};

export type WhatsAppMessagePreviewProps = {
  heading?: string;
  deviceName: string;
  languageLabel: string;
  headerType?: WhatsAppHeaderType;
  body: string;
  footer?: string;
  buttons?: WhatsAppPreviewButton[];
  disclaimer?: string;
};
