export type ContactSource = "whatsapp" | "import" | "manual" | "api" | "meta_inbound";
export type ConsentStatus = "opt_in" | "opt_out" | "unknown";
export type MarketingStatus = "subscribed" | "unsubscribed" | "unknown";
export type ContactFieldType = "text" | "number" | "date" | "boolean" | "select";

export interface ContactTagRef {
  id: string;
  name: string;
  color: string;
}

export interface ContactFieldDefinition {
  id: string;
  field_key: string;
  label: string;
  field_type: ContactFieldType;
  options?: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContactCustomField {
  id: string;
  field_key: string;
  label: string;
  field_type: ContactFieldType;
  options?: string[];
  value: string | number | boolean | null;
}

export interface ContactLastCampaign {
  id: string;
  name: string;
  sent_at: string;
}

export interface ContactActivity {
  id: string;
  type: "message" | "campaign" | "tag" | "import" | "consent";
  text: string;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: ContactSource;
  tags: ContactTagRef[];
  consent_status: ConsentStatus;
  marketing_status: MarketingStatus;
  last_activity_at?: string;
  country?: string;
  province?: string;
  city?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  language?: string;
  customer_type?: string;
  custom_fields: ContactCustomField[];
  created_at: string;
  updated_at: string;
  conversations_count: number;
  last_campaign?: ContactLastCampaign;
  campaigns_received?: number;
  campaigns_clicked?: number;
  last_conversation_at?: string;
  activities?: ContactActivity[];
}

export interface ContactTag {
  id: string;
  name: string;
  description: string;
  color: string;
  contact_count: number;
  updated_at: string;
  created_at: string;
  created_by: string;
}

export interface ContactImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors?: string[];
}

export interface ContactFormInput {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  country?: string;
  province?: string;
  city?: string;
  company?: string;
  job_title?: string;
  consent_status?: ConsentStatus;
  tag_ids?: string[];
  custom_fields?: Record<string, string | number | boolean | null>;
}

export interface ContactStats {
  total: number;
  opt_in: number;
  opt_out: number;
  unknown: number;
}

export interface ContactListParams {
  search?: string;
  tag_id?: string;
  consent_status?: ConsentStatus;
  page?: number;
  page_size?: number;
}

export interface ContactListResult {
  items: Contact[];
  total: number;
  page: number;
  page_size: number;
}
