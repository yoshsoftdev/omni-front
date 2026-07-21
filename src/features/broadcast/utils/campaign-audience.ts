import type { ContactTag } from "@/types/contact";

export function countTagRecipients(tags: ContactTag[], selectedIds: string[]) {
  return tags
    .filter((tag) => selectedIds.includes(tag.id))
    .reduce((sum, tag) => sum + tag.contact_count, 0);
}

export function campaignEstimatedRecipients(tags: ContactTag[], selectedTagIds: string[]) {
  return countTagRecipients(tags, selectedTagIds);
}

export function campaignAudienceSummary(tags: ContactTag[], selectedTagIds: string[]) {
  if (selectedTagIds.length === 0) {
    return "Not selected";
  }

  const selected = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const total = countTagRecipients(tags, selectedTagIds);
  if (selectedTagIds.length === 1) {
    return `${selected[0]?.name ?? "Tag"} (${total.toLocaleString()} contacts)`;
  }
  return `${selectedTagIds.length} tags (~${total.toLocaleString()} contacts)`;
}
