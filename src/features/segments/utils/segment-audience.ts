import type { Segment } from "@/features/segments/types/segment";

export function segmentAudienceSummary(segments: Segment[], selectedIds: string[]) {
  if (selectedIds.length === 0) return "Not selected";
  const selected = segments.filter((s) => selectedIds.includes(s.id));
  const totalContacts = selected.reduce((sum, s) => sum + s.contact_count, 0);
  if (selectedIds.length === 1) {
    return `${selected[0]?.name} (${totalContacts.toLocaleString()} contacts)`;
  }
  return `${selectedIds.length} segments (~${totalContacts.toLocaleString()} contacts)`;
}
