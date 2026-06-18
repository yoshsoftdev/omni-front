export type SegmentRuleField = "tag" | "city" | "last_activity" | "consent_status" | "source";
export type SegmentRuleOperator = "equals" | "not_equals" | "contains" | "less_than" | "greater_than";

export interface SegmentRule {
  id: string;
  field: SegmentRuleField;
  operator: SegmentRuleOperator;
  value: string;
}

export interface ContactSegment {
  id: string;
  name: string;
  description: string;
  color: string;
  contact_count: number;
  updated_at: string;
  created_at: string;
  rules: SegmentRule[];
}
