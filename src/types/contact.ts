import type { Tag } from "@/types/tag";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
}

export interface ContactImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors?: string[];
}

export interface CreateContactInput {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tag_ids?: string[];
}
