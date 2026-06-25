import type { Segment } from "@/features/segments/types/segment";
import type { ContactTag } from "@/types/contact";

export function countSegmentRecipients(segments: Segment[], selectedIds: string[]) {
  return segments
    .filter((segment) => selectedIds.includes(segment.id))
    .reduce((sum, segment) => sum + segment.contact_count, 0);
}

export function countTagRecipients(tags: ContactTag[], selectedIds: string[]) {
  return tags
    .filter((tag) => selectedIds.includes(tag.id))
    .reduce((sum, tag) => sum + tag.contact_count, 0);
}

export function campaignEstimatedRecipients(
  segments: Segment[],
  selectedSegmentIds: string[],
  tags: ContactTag[],
  selectedTagIds: string[],
) {
  return countSegmentRecipients(segments, selectedSegmentIds) + countTagRecipients(tags, selectedTagIds);
}

export function campaignAudienceSummary(
  segments: Segment[],
  selectedSegmentIds: string[],
  tags: ContactTag[],
  selectedTagIds: string[],
) {
  const parts: string[] = [];

  if (selectedSegmentIds.length > 0) {
    const selected = segments.filter((segment) => selectedSegmentIds.includes(segment.id));
    const total = countSegmentRecipients(segments, selectedSegmentIds);
    if (selectedSegmentIds.length === 1) {
      parts.push(`${selected[0]?.name ?? "Segment"} (${total.toLocaleString()} contacts)`);
    } else {
      parts.push(`${selectedSegmentIds.length} segments (~${total.toLocaleString()} contacts)`);
    }
  }

  if (selectedTagIds.length > 0) {
    const selected = tags.filter((tag) => selectedTagIds.includes(tag.id));
    const total = countTagRecipients(tags, selectedTagIds);
    if (selectedTagIds.length === 1) {
      parts.push(`${selected[0]?.name ?? "Tag"} (${total.toLocaleString()} contacts)`);
    } else {
      parts.push(`${selectedTagIds.length} tags (~${total.toLocaleString()} contacts)`);
    }
  }

  return parts.length > 0 ? parts.join(" + ") : "Not selected";
}
