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

type ContactNameFields = {
  contact_name?: string;
  customer_name?: string;
  name?: string;
  phone: string;
};

export function resolveContactNameFields(contact: ContactNameFields): {
  contact_name: string;
  customer_name: string;
} {
  const contactName = (contact.contact_name ?? contact.name ?? "").trim();
  const customerName = (contact.customer_name ?? contact.name ?? contact.contact_name ?? "").trim();
  return {
    contact_name: contactName,
    customer_name: customerName,
  };
}

export function isUnsavedContact(contact: ContactNameFields): boolean {
  const { contact_name, customer_name } = resolveContactNameFields(contact);
  if (!contact.phone.trim()) return !contact_name.trim() && !customer_name.trim();
  return isPhoneOnlyName(contact_name || customer_name, contact.phone);
}

export function isPlaceholderContactName(name: string, contactId?: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (trimmed === "Unknown contact" || trimmed === "Unknown") return true;
  if (contactId && trimmed === `Contact ${contactId.slice(0, 8)}`) return true;
  return /^Contact [0-9a-f]{8}$/i.test(trimmed);
}

export function resolveContactDisplayName(contact: ContactNameFields): string {
  const { contact_name, customer_name } = resolveContactNameFields(contact);
  if (isUnsavedContact(contact)) {
    return contact.phone.trim() || contact_name || customer_name || "Unknown";
  }
  return contact_name || customer_name || contact.phone.trim() || "Unknown";
}

export function resolveConversationContactLabel(
  contactId: string,
  options: {
    contact_name?: string;
    customer_name?: string;
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
  const candidateName =
    options.contact_name?.trim() ||
    options.name?.trim() ||
    options.customer_name?.trim() ||
    options.fallbackName?.trim() ||
    "";
  const name = isPlaceholderContactName(candidateName, contactId)
    ? phone || candidateName || "Unknown"
    : candidateName || phone || "Unknown";
  return { name, phone };
}
