import {
  mockScheduledCampaigns,
  type ScheduledCampaign,
  type ScheduleStatus,
} from "@/features/broadcast/mock/mock-data";

export type ScheduleListFilters = {
  tab?: string;
  page?: number;
  pageSize?: number;
};

export type ScheduleListResult = {
  items: ScheduledCampaign[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

let campaignsState = [...mockScheduledCampaigns];

export async function fetchScheduleList(
  filters: ScheduleListFilters = {},
): Promise<ScheduleListResult> {
  const { tab = "all", page = 1, pageSize = 8 } = filters;

  await new Promise((resolve) => setTimeout(resolve, 120));

  let items = [...campaignsState];
  if (tab !== "all") {
    items = items.filter((item) => item.status === tab);
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

export async function cancelScheduledCampaign(id: string): Promise<ScheduledCampaign> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const index = campaignsState.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error("Campaign not found");
  }

  const updated: ScheduledCampaign = {
    ...campaignsState[index],
    status: "cancelled" as ScheduleStatus,
  };
  campaignsState[index] = updated;
  return updated;
}

export function resetScheduleMockState() {
  campaignsState = [...mockScheduledCampaigns];
}
