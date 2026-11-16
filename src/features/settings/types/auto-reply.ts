/** Welcome message sent when a customer's first conversation on a channel starts. */
export interface WelcomeSettings {
  enabled: boolean;
  text: string;
}

export type KeywordMatchType = "exact" | "contains";

/** Answers an inbound text message matching one of its keywords (first enabled rule wins). */
export interface KeywordRule {
  id: string;
  keywords: string[];
  match_type: KeywordMatchType;
  reply_text: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type KeywordRuleInput = Pick<KeywordRule, "keywords" | "match_type" | "reply_text" | "enabled" | "sort_order">;

export const AUTO_REPLY_MAX_CHARS = 1000;

/** "harga, price list,, Jam buka" → ["harga", "price list", "Jam buka"] */
export function parseKeywords(raw: string): string[] {
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}
