export type BroadcastStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "completed"
  | "failed"
  | "cancelled";

export interface Broadcast {
  id: string;
  device_id: string;
  name: string;
  message: string;
  status: BroadcastStatus;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBroadcastInput {
  name: string;
  message: string;
  device_id: string;
  contact_ids?: string[];
  tag_ids?: string[];
  scheduled_at?: string;
}
