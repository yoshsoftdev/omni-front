export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isPhoneOnlyName(name: string, phone: string): boolean {
  const trimmedName = name.trim();
  if (!trimmedName) return true;

  const nameDigits = normalizePhoneDigits(trimmedName);
  const phoneDigits = normalizePhoneDigits(phone);
  if (phoneDigits && nameDigits === phoneDigits) return true;

  return trimmedName === phone.trim();
}

export function isUnsavedContact(contact: { name: string; phone: string }): boolean {
  if (!contact.phone.trim()) return !contact.name.trim();
  return isPhoneOnlyName(contact.name, contact.phone);
}

export function isPlaceholderContactName(name: string, contactId?: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (trimmed === "Unknown contact" || trimmed === "Unknown") return true;
  if (contactId && trimmed === `Contact ${contactId.slice(0, 8)}`) return true;
  return /^Contact [0-9a-f]{8}$/i.test(trimmed);
}

export function resolveContactDisplayName(contact: { name: string; phone: string }): string {
  if (isUnsavedContact(contact)) {
    return contact.phone.trim() || contact.name.trim() || "Unknown";
  }
  return contact.name.trim() || contact.phone.trim() || "Unknown";
}

export function resolveConversationContactLabel(
  contactId: string,
  options: {
    name?: string;
    phone?: string;
    fallbackName?: string;
    fallbackPhone?: string;
  },
): { name: string; phone: string } {
  const phone =
    options.phone?.trim() ||
    options.fallbackPhone?.trim() ||
    "";
  const candidateName = options.name?.trim() || options.fallbackName?.trim() || "";
  const name = isPlaceholderContactName(candidateName, contactId)
    ? phone || candidateName || "Unknown"
    : candidateName || phone || "Unknown";
  return { name, phone };
}
