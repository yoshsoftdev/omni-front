import { apiClient } from "@/services/api/client";
import type { Contact, ContactImportResult, CreateContactInput } from "@/types/contact";

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
    return response.data?.items ?? response.data?.contacts ?? [];
  },

  async create(input: CreateContactInput) {
    const response = await apiClient.post<Contact>("/contacts", input);
    return response.data!;
  },

  async update(id: string, input: CreateContactInput) {
    const response = await apiClient.patch<Contact>(`/contacts/${id}`, input);
    return response.data!;
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
