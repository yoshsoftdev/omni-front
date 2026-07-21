export interface QuickReply {
  id: string;
  category: string;
  content: string;
  text: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuickReplyInput {
  category: string;
  content: string;
}

export const QUICK_REPLY_VARIABLES = [
  "{{customer_name}}",
  "{{agent_name}}",
  "{{company_name}}",
  "{{phone}}",
  "{{today}}",
] as const;
