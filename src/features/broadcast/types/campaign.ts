export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "completed"
  | "cancelled"
  | "failed";

/** Frontend domain model for campaigns. */
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;

  device_id?: string;
  device_name?: string;
  device_phone?: string;

  template_id: string;
  template_name: string;
  template_category: string;
  template_language: string;

  segment_id: string;
  segment_name: string;
  segment_contact_count: number;
  total_contacts: number;

  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  timezone?: string;
  send_mode?: "now" | "later";

  variable_mapping: Record<string, string>;
  sample_values?: Record<string, string>;

  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  reply_count: number;
  clicked_count: number;

  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface CampaignLinkMetric {
  id: string;
  url: string;
  clicks: number;
  unique_clicks: number;
  ctr: number;
}

export interface CampaignLocationMetric {
  city: string;
  region: string;
  count: number;
}

export interface CampaignDeviceMetric {
  device: "mobile" | "desktop" | "other";
  count: number;
  percentage: number;
}

export interface CampaignReportDetail {
  campaign: Campaign;
  funnel: {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
    replies: number;
  };
  links: CampaignLinkMetric[];
  locations: CampaignLocationMetric[];
  devices: CampaignDeviceMetric[];
}

export interface ReportDashboardStats {
  total_campaigns: number;
  messages_sent: number;
  delivered_rate: number;
  read_rate: number;
  reply_rate: number;
  changes: {
    campaigns: string;
    sent: string;
    delivered: string;
    read: string;
    replies: string;
  };
}

export interface PerformanceTrendPoint {
  date: string;
  label: string;
  sent: number;
  delivered: number;
  read: number;
  replies: number;
}

export interface ChannelBreakdown {
  channel: "whatsapp" | "instagram" | "other";
  percentage: number;
  count: number;
}

export type PerformanceDataPoint = {
  date: string;
  label: string;
  sent: number;
  read: number;
  failed: number;
};

export type DeliveryBreakdown = {
  label: string;
  value: number;
};

export type HourlyPerformance = {
  hour: number;
  count: number;
};
