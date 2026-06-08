import {
  mockTemplateList,
  type TemplateListItem,
} from "@/features/broadcast/mock/mock-data";

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

export async function fetchTemplateList(filters: TemplateListFilters = {}): Promise<TemplateListResult> {
  const {
    search = "",
    language = "all",
    category = "all",
    status = "all",
    page = 1,
    pageSize = 8,
  } = filters;

  await new Promise((resolve) => setTimeout(resolve, 150));

  let items = [...mockTemplateList];

  const query = search.trim().toLowerCase();
  if (query) {
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.preview.toLowerCase().includes(query),
    );
  }
  if (language !== "all") {
    items = items.filter((item) => item.language === language);
  }
  if (category !== "all") {
    items = items.filter((item) => item.category === category);
  }
  if (status !== "all") {
    items = items.filter((item) => item.status === status);
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function syncTemplates(): Promise<{ synced: number }> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { synced: mockTemplateList.length };
}
