export type CampaignApiStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "sending"
  | "completed"
  | "failed"
  | "cancelled";

export type TemplateApiStatus = "APPROVED" | "PENDING" | "REJECTED";

export type TemplateComponentButtonDTO = {
  type: "URL" | "QUICK_REPLY" | "PHONE_NUMBER" | "OTP" | "COPY_CODE";
  text: string;
  url?: string;
  phone_number?: string;
  otp_type?: string;
};

export type TemplateComponentDTO =
  | {
      type: "HEADER";
      format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
      text?: string;
    }
  | {
      type: "BODY";
      text: string;
      example?: { body_text?: string[][] };
    }
  | {
      type: "FOOTER";
      text: string;
    }
  | {
      type: "BUTTONS";
      buttons: TemplateComponentButtonDTO[];
    };

/** Backend API wire format for templates. */
export interface TemplateDTO {
  id: string;
  device_id: string;
  waba_id: string;
  meta_template_id: string;
  name: string;
  language: string;
  category?: string;
  status?: TemplateApiStatus | string;
  preview?: string;
  components: TemplateComponentDTO[];
  created_at: string;
  updated_at: string;
}

/** @deprecated Use TemplateDTO */
export type WhatsAppTemplate = TemplateDTO;

/** Backend API wire format for campaigns. */
export interface CampaignDTO {
  id: string;
  name: string;
  status: CampaignApiStatus;
  device_id: string;
  device_name?: string;
  device_phone?: string;
  template_id: string;
  template_name?: string;
  template_category?: string;
  template_language?: string;
  variable_mapping: {
    body?: Record<string, string>;
  };
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  name: string;
  device_id: string;
  template_id: string;
  variable_mapping?: {
    body?: Record<string, string>;
  };
  contact_ids?: string[];
  tag_ids?: string[];
  segment_ids?: string[];
  scheduled_at?: string;
}

export const CONTACT_FIELD_OPTIONS = [
  { value: "name", label: "Nama Kontak" },
  { value: "phone", label: "Nomor Telepon" },
  { value: "email", label: "Email" },
  { value: "notes", label: "Catatan" },
] as const;
