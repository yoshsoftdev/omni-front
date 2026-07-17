export type ContactSource = "whatsapp" | "import" | "manual" | "api" | "meta_inbound" | "ig";
export type ConsentStatus = "opt_in" | "opt_out" | "unknown";
export type MarketingStatus = "subscribed" | "unsubscribed" | "unknown";
export type ContactFieldType = "text" | "number" | "date" | "boolean" | "select";
export type ProviderKind = "whatsapp" | "instagram" | "messenger" | "telegram" | "email" | (string & {});
export type ProviderStatus = "active" | "unavailable" | "unlinked";

export interface ProviderProfile {
  id: string;
  contact_id: string;
  provider: ProviderKind;
  provider_user_id: string;
  channel_id?: string;
  display_name?: string;
  username?: string;
  phone?: string;
  avatar_url?: string;
  email?: string;
  metadata?: Record<string, unknown>;
  connected_at: string;
  status: ProviderStatus;
  is_source_of_truth: boolean;
  conversation_ids?: string[];
}

export interface LinkedContact {
  link_id: string;
  id: string;
  contact_name: string;
  customer_name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  provider_kinds: ProviderKind[];
  linked_at: string;
}

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
  type: "message" | "campaign" | "tag" | "import" | "consent" | "provider_linked" | "provider_unlinked" | "source_of_truth_changed";
  text: string;
  actor_name?: string;
  created_at: string;
}

export interface Contact {
  id: string;
  contact_name: string;
  customer_name: string;
  /** @deprecated use contact_name */
  name?: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  source: ContactSource;
  tags: ContactTagRef[];
  providers?: ProviderProfile[];
  linked_contacts?: LinkedContact[];
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
  contact_name: string;
  customer_name?: string;
  /** @deprecated use contact_name */
  name?: string;
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
