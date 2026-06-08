export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "sending"
  | "completed"
  | "failed"
  | "cancelled";

export interface WhatsAppTemplate {
  id: string;
  device_id: string;
  waba_id: string;
  meta_template_id: string;
  name: string;
  language: string;
  category?: string;
  status?: string;
  preview?: string;
  components: unknown;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  device_id: string;
  template_id: string;
  name: string;
  status: CampaignStatus;
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
  device_name?: string;
  device_phone?: string;
  template_name?: string;
  template_language?: string;
  template_category?: string;
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
  scheduled_at?: string;
}

export const CONTACT_FIELD_OPTIONS = [
  { value: "name", label: "Nama Kontak" },
  { value: "phone", label: "Nomor Telepon" },
  { value: "email", label: "Email" },
  { value: "notes", label: "Catatan" },
] as const;
