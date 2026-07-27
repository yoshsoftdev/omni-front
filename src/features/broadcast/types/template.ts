export type TemplateStatus = "APPROVED" | "PENDING" | "REJECTED";

export type TemplateHeaderType = "none" | "image" | "video" | "document";

export type TemplateButtonType = "url" | "quick_reply" | "copy_code";

export type TemplateCategory = "Marketing" | "Utility" | "Authentication";

export interface TemplateButton {
  id: string;
  type: TemplateButtonType;
  text: string;
  url?: string;
  code?: string;
}

export interface TemplateHeader {
  type: TemplateHeaderType;
  title?: string;
  media_file_name?: string;
  /**
   * True when template has storage_object_id (uploaded in-app).
   * Campaign send resolves Cloud media id via Media Manager — no public URL required.
   * Meta template header_handle alone is NOT enough for send.
   */
  storage_backed?: boolean;
}

/** Frontend domain model for WhatsApp templates. */
export interface Template {
  id: string;
  name: string;
  language: string;
  language_label: string;
  category: TemplateCategory;
  status: TemplateStatus;
  preview: string;

  header: TemplateHeader;
  body: string;
  footer?: string;
  buttons: TemplateButton[];
  variable_count: number;

  device_id?: string;
  waba_id?: string;
  meta_template_id?: string;
  created_at?: string;
  updated_at?: string;
  last_sync_at?: string;
}
