import { toTemplateListItem } from "@/features/broadcast/mock/template-legacy-adapters";
import { templateQueryService } from "@/features/broadcast/services/template-query.service";
import type { TemplateListItem } from "@/features/broadcast/mock/template-legacy-adapters";

export type TemplateListFilters = {
  search?: string;
  language?: string;
  category?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type TemplateListResult = {
  items: TemplateListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Legacy mock list helper — delegates filtering/paging to TemplateQueryService. */
export async function fetchTemplateList(filters: TemplateListFilters = {}): Promise<TemplateListResult> {
  const page = await templateQueryService.getTemplatesPage({
    search: filters.search,
    language: filters.language,
    category: filters.category,
    status: filters.status,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 8,
  });
  return {
    items: page.items.map(toTemplateListItem),
    total: page.pagination.total,
    page: page.pagination.page,
    pageSize: page.pagination.page_size,
    totalPages: page.pagination.total_pages,
  };
}

export async function syncTemplates(deviceId: string): Promise<{ synced: number }> {
  return templateQueryService.syncTemplates(deviceId);
}
