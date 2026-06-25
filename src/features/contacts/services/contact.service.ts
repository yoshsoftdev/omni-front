import { apiClient } from "@/services/api/client";
import { normalizeContact } from "@/features/contacts/mappers/contact.mapper";
import type { ConsentStatus, Contact, ContactImportResult, CreateContactInput } from "@/types/contact";

function toMarketingStatus(consent?: ConsentStatus): string | undefined {
  if (!consent) return undefined;
  if (consent === "opt_in") return "subscribed";
  if (consent === "opt_out") return "unsubscribed";
  return "unknown";
}

function buildContactPayload(input: Partial<CreateContactInput>) {
  const payload: Record<string, string | undefined> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.email !== undefined) payload.email = input.email;
  if (input.notes !== undefined) payload.notes = input.notes;
  if (input.consent_status !== undefined) {
    payload.marketing_status = toMarketingStatus(input.consent_status);
    payload.consent_status = input.consent_status;
  }
  return payload;
}

type PageResponse<T> = {
  items?: T[];
  contacts?: T[];
};

export const contactService = {
  async list(params?: { search?: string; tag_id?: string }) {
    const query = new URLSearchParams();
    query.set("page_size", "100");
    if (params?.search) query.set("search", params.search);
    if (params?.tag_id) query.set("tag_id", params.tag_id);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<PageResponse<Contact>>(`/contacts${suffix}`);
    const rows = response.data?.items ?? response.data?.contacts ?? [];
    return rows.map((row) => normalizeContact(row));
  },

  async getById(id: string) {
    const response = await apiClient.get<Contact>(`/contacts/${id}`);
    return normalizeContact(response.data!);
  },

  async create(input: CreateContactInput) {
    const response = await apiClient.post<Contact>("/contacts", {
      ...input,
      marketing_status: toMarketingStatus(input.consent_status),
    });
    return normalizeContact(response.data!);
  },

  async update(id: string, input: Partial<CreateContactInput>) {
    const response = await apiClient.patch<Contact>(`/contacts/${id}`, buildContactPayload(input));
    return normalizeContact(response.data!);
  },

  async remove(id: string) {
    await apiClient.delete(`/contacts/${id}`);
  },

  async importCSV(file: File) {
    const response = await apiClient.upload<ContactImportResult>("/contacts/import/csv", file);
    return response.data!;
  },

  async importExcel(file: File) {
    const response = await apiClient.upload<ContactImportResult>("/contacts/import/excel", file);
    return response.data!;
  },
};
