export type ContactSource = "whatsapp" | "import" | "manual" | "api";
export type ConsentStatus = "opt_in" | "opt_out" | "unknown";

export interface ContactTagRef {
  id: string;
  name: string;
  color: string;
}

export interface ContactCampaign {
  id: string;
  name: string;
  status: "delivered" | "read" | "clicked" | "failed";
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
  last_activity_at?: string;
  language?: string;
  customer_type?: string;
  city?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  conversations_count: number;
  campaigns_received: number;
  campaigns_clicked: number;
  last_conversation_at?: string;
  recent_campaigns?: ContactCampaign[];
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

export interface CreateContactInput {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  source?: ContactSource;
  consent_status?: ConsentStatus;
  tag_ids?: string[];
}

export interface ContactStats {
  total: number;
  opt_in: number;
  opt_out: number;
  unknown: number;
}
