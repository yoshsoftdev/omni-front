import { apiClient } from "@/services/api/client";
import {
  consentToMarketing,
  normalizeContact,
  normalizeFieldDefinition,
  serializeCustomFieldValue,
} from "@/features/contacts/mappers/contact.mapper";
import type {
  Contact,
  ContactFieldDefinition,
  ContactFieldType,
  ContactFormInput,
  ContactImportResult,
  ContactListParams,
  ContactListResult,
  ContactStats,
  ContactActivity,
  LinkedContact,
  ProviderProfile,
} from "@/types/contact";

type PageResponse<T> = {
  items?: T[];
  contacts?: T[];
  pagination?: {
    total?: number;
    page?: number;
    page_size?: number;
  };
};

export const CONTACTS_UPDATED_EVENT = "contacts:updated";

function emitContactsUpdated(contactId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CONTACTS_UPDATED_EVENT, {
      detail: { contact_id: contactId ?? "" },
    }),
  );
}

function buildContactPayload(input: Partial<ContactFormInput>) {
  const payload: Record<string, unknown> = {};
  if (input.contact_name !== undefined) payload.contact_name = input.contact_name;
  if (input.customer_name !== undefined) payload.customer_name = input.customer_name;
  if (input.name !== undefined) payload.name = input.name;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.email !== undefined) payload.email = input.email;
  if (input.notes !== undefined) payload.notes = input.notes;
  if (input.country !== undefined) payload.country = input.country;
  if (input.province !== undefined) payload.province = input.province;
  if (input.city !== undefined) payload.city = input.city;
  if (input.company !== undefined) payload.company = input.company;
  if (input.job_title !== undefined) payload.job_title = input.job_title;
  if (input.consent_status !== undefined) {
    const marketing = consentToMarketing(input.consent_status);
    payload.marketing_status = marketing;
    payload.consent_status = input.consent_status;
  }
  if (input.tag_ids !== undefined) payload.tag_ids = input.tag_ids;
  if (input.custom_fields !== undefined) payload.custom_fields = input.custom_fields;
  return payload;
}

export const contactService = {
  async list(params?: ContactListParams): Promise<ContactListResult> {
    const query = new URLSearchParams();
    query.set("page", String(params?.page ?? 1));
    query.set("page_size", String(params?.page_size ?? 20));
    if (params?.search) query.set("search", params.search);
    if (params?.tag_id) query.set("tag_id", params.tag_id);
    if (params?.consent_status) query.set("consent_status", params.consent_status);
    const response = await apiClient.get<PageResponse<Contact>>(`/contacts?${query.toString()}`);
    const rows = response.data?.items ?? response.data?.contacts ?? [];
    return {
      items: rows.map((row) => normalizeContact(row)),
      total: response.data?.pagination?.total ?? rows.length,
      page: response.data?.pagination?.page ?? params?.page ?? 1,
      page_size: response.data?.pagination?.page_size ?? params?.page_size ?? 20,
    };
  },

  async stats(): Promise<ContactStats> {
    const response = await apiClient.get<ContactStats>("/contacts/stats");
    return {
      total: response.data?.total ?? 0,
      opt_in: response.data?.opt_in ?? 0,
      opt_out: response.data?.opt_out ?? 0,
      unknown: response.data?.unknown ?? 0,
    };
  },

  async getById(id: string) {
    const response = await apiClient.get<Contact>(`/contacts/${id}`);
    return normalizeContact(response.data!);
  },

  async listProviders(contactId: string): Promise<ProviderProfile[]> {
    const response = await apiClient.get<{ providers?: ProviderProfile[] }>(`/contacts/${contactId}/providers`);
    return response.data?.providers ?? [];
  },

  async listActivities(contactId: string): Promise<ContactActivity[]> {
    const response = await apiClient.get<{
      activities?: Array<ContactActivity & { description?: string }>;
    }>(`/contacts/${contactId}/activities`);
    return (response.data?.activities ?? []).flatMap((activity) => {
      const text = activity.text?.trim() || activity.description?.trim();
      return text ? [{ ...activity, text }] : [];
    });
  },

  async listLinks(contactId: string): Promise<LinkedContact[]> {
    const response = await apiClient.get<{ linked_contacts?: LinkedContact[] }>(
      `/contacts/${contactId}/links`,
    );
    return response.data?.linked_contacts ?? [];
  },

  async linkContact(contactId: string, linkedContactId: string): Promise<LinkedContact> {
    const response = await apiClient.post<LinkedContact>(`/contacts/${contactId}/links`, {
      contact_id: linkedContactId,
    });
    emitContactsUpdated(contactId);
    emitContactsUpdated(linkedContactId);
    return response.data!;
  },

  async unlinkContact(contactId: string, linkedContactId: string) {
    await apiClient.delete(`/contacts/${contactId}/links/${linkedContactId}`);
    emitContactsUpdated(contactId);
    emitContactsUpdated(linkedContactId);
  },

  async linkProvider(profileId: string, contactId: string) {
    const response = await apiClient.post<{ profile: ProviderProfile }>(`/providers/${profileId}/link`, {
      contact_id: contactId,
    });
    emitContactsUpdated(contactId);
    return response.data!;
  },

  async unlinkProvider(profileId: string) {
    const response = await apiClient.post<{ profile: ProviderProfile; new_contact_id: string }>(
      `/providers/${profileId}/unlink`,
      {},
    );
    emitContactsUpdated();
    return response.data!;
  },

  async setSourceOfTruth(profileId: string) {
    const response = await apiClient.patch<ProviderProfile>(`/providers/${profileId}/source-of-truth`, {});
    emitContactsUpdated(response.data?.contact_id);
    return response.data!;
  },

  async create(input: ContactFormInput) {
    const response = await apiClient.post<Contact>("/contacts", buildContactPayload(input));
    const saved = normalizeContact(response.data!);
    emitContactsUpdated(saved.id);
    return saved;
  },

  async update(id: string, input: Partial<ContactFormInput>) {
    const response = await apiClient.patch<Contact>(`/contacts/${id}`, buildContactPayload(input));
    const saved = normalizeContact(response.data!);
    emitContactsUpdated(saved.id);
    return saved;
  },

  async remove(id: string) {
    await apiClient.delete(`/contacts/${id}`);
    emitContactsUpdated(id);
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

export const contactFieldService = {
  async listDefinitions(): Promise<ContactFieldDefinition[]> {
    const response = await apiClient.get<{ items?: ContactFieldDefinition[] }>("/contacts/field-definitions");
    const rows = response.data?.items ?? [];
    return rows.map((row) => normalizeFieldDefinition(row));
  },

  async createDefinition(input: {
    field_key: string;
    label: string;
    field_type: ContactFieldType;
    options?: string[];
    sort_order?: number;
  }) {
    const response = await apiClient.post<ContactFieldDefinition>("/contacts/field-definitions", {
      ...input,
      options: input.options ? JSON.stringify(input.options) : undefined,
    });
    return normalizeFieldDefinition(response.data!);
  },

  buildCustomFieldPayload(
    definitions: ContactFieldDefinition[],
    values: Record<string, string | number | boolean | null | undefined>,
  ): Record<string, string | number | boolean | null> {
    const payload: Record<string, string | number | boolean | null> = {};
    for (const def of definitions) {
      if (!(def.field_key in values)) continue;
      payload[def.field_key] = serializeCustomFieldValue(def.field_type, values[def.field_key]) as string | number | boolean | null;
    }
    return payload;
  },

  mergeDefinitionsWithValues(
    definitions: ContactFieldDefinition[],
    contact?: Contact,
  ) {
    const byKey = new Map(contact?.custom_fields.map((field) => [field.field_key, field.value]) ?? []);
    return definitions.map((def) => ({
      ...def,
      value: byKey.get(def.field_key) ?? null,
    }));
  },
};
