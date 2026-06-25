import type { Segment, SegmentRule } from "@/features/segments/types/segment";

type ApiRule = {
  id?: string;
  ID?: string;
  field?: string;
  Field?: string;
  operator?: string;
  Operator?: string;
  value?: string;
  Value?: string;
};

type ApiSegment = Partial<Segment> & {
  ID?: string;
  Name?: string;
  Description?: string;
  Color?: string;
  ContactCount?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  rules?: ApiRule[];
  Rules?: ApiRule[];
};

type SegmentGetResponse = {
  segment?: ApiSegment;
  rules?: ApiRule[];
};

function readString(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function mapRules(rawRules: ApiRule[] | undefined): SegmentRule[] {
  return (rawRules ?? []).map((rule, index) => ({
    id: readString(rule.id, rule.ID) || `rule_${index}`,
    field: (readString(rule.field, rule.Field) || "tag") as SegmentRule["field"],
    operator: (readString(rule.operator, rule.Operator) || "equals") as SegmentRule["operator"],
    value: readString(rule.value, rule.Value),
  }));
}

export function normalizeSegment(raw: ApiSegment, rules?: ApiRule[]): Segment {
  const createdAt = readString(raw.created_at, raw.CreatedAt) || new Date(0).toISOString();
  const updatedAt = readString(raw.updated_at, raw.UpdatedAt) || createdAt;
  const embeddedRules = raw.rules ?? raw.Rules ?? rules;

  return {
    id: readString(raw.id, raw.ID),
    name: readString(raw.name, raw.Name),
    description: readString(raw.description, raw.Description),
    color: readString(raw.color, raw.Color) || "#6366f1",
    contact_count: raw.contact_count ?? raw.ContactCount ?? 0,
    created_at: createdAt,
    updated_at: updatedAt,
    rules: mapRules(embeddedRules),
  };
}

export function normalizeSegmentGetResponse(data: SegmentGetResponse | ApiSegment): Segment {
  if ("segment" in data && data.segment) {
    return normalizeSegment(data.segment, data.rules);
  }
  return normalizeSegment(data as ApiSegment);
}
