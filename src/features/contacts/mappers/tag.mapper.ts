import type { ContactTag } from "@/types/contact";

type ApiTag = Partial<ContactTag> & {
  ID?: string;
  Name?: string;
  Color?: string;
  Description?: string;
  ContactCount?: number;
  CreatedBy?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
};

function readString(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

export function normalizeTag(raw: ApiTag): ContactTag {
  const createdAt = readString(raw.created_at, raw.CreatedAt) || new Date(0).toISOString();
  const updatedAt = readString(raw.updated_at, raw.UpdatedAt) || createdAt;

  return {
    id: readString(raw.id, raw.ID),
    name: readString(raw.name, raw.Name),
    description: readString(raw.description, raw.Description),
    color: readString(raw.color, raw.Color) || "#6366f1",
    contact_count: raw.contact_count ?? raw.ContactCount ?? 0,
    created_at: createdAt,
    updated_at: updatedAt,
    created_by: readString(raw.created_by, raw.CreatedBy) || "—",
  };
}
