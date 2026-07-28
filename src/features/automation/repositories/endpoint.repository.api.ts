import { apiClient } from "@/services/api/client";
import type { EndpointRepository } from "@/features/automation/repositories/endpoint.repository";
import type { EndpointAnalytics, InvokeResult } from "@/features/automation/types/analytics";
import type {
  AutomationEndpoint,
  AutomationSummary,
  CreateEndpointInput,
  EndpointListPage,
  EndpointListQuery,
  UpdateEndpointInput,
} from "@/features/automation/types/endpoint";

type PagePayload<T> = {
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

class ApiEndpointRepository implements EndpointRepository {
  async getSummary(): Promise<AutomationSummary> {
    const res = await apiClient.get<AutomationSummary>("/automation/summary");
    return res.data as AutomationSummary;
  }

  async list(query: EndpointListQuery = {}): Promise<EndpointListPage> {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.status && query.status !== "all") params.set("status", query.status);
    if (query.actionType && query.actionType !== "all") params.set("actionType", query.actionType);
    params.set("page", String(query.page ?? 1));
    params.set("page_size", String(query.pageSize ?? 10));
    const res = await apiClient.get<PagePayload<AutomationEndpoint>>(
      `/automation/endpoints?${params.toString()}`,
    );
    const payload = res.data as PagePayload<AutomationEndpoint>;
    return {
      items: (payload.items ?? []).map(normalizeEndpoint),
      pagination: {
        page: payload.pagination.page,
        pageSize: payload.pagination.page_size,
        total: payload.pagination.total,
        totalPages: payload.pagination.total_pages,
      },
    };
  }

  async getById(id: string): Promise<AutomationEndpoint | undefined> {
    try {
      const res = await apiClient.get<AutomationEndpoint>(`/automation/endpoints/${id}`);
      return normalizeEndpoint(res.data as AutomationEndpoint);
    } catch {
      return undefined;
    }
  }

  async create(input: CreateEndpointInput): Promise<AutomationEndpoint> {
    const res = await apiClient.post<AutomationEndpoint>("/automation/endpoints", input);
    return normalizeEndpoint(res.data as AutomationEndpoint);
  }

  async update(id: string, patch: UpdateEndpointInput): Promise<AutomationEndpoint> {
    const res = await apiClient.patch<AutomationEndpoint>(`/automation/endpoints/${id}`, patch);
    return normalizeEndpoint(res.data as AutomationEndpoint);
  }

  async duplicate(id: string): Promise<AutomationEndpoint> {
    const res = await apiClient.post<AutomationEndpoint>(`/automation/endpoints/${id}/duplicate`);
    return normalizeEndpoint(res.data as AutomationEndpoint);
  }

  async setStatus(id: string, status: "active" | "disabled"): Promise<AutomationEndpoint> {
    const path =
      status === "active"
        ? `/automation/endpoints/${id}/enable`
        : `/automation/endpoints/${id}/disable`;
    const res = await apiClient.post<AutomationEndpoint>(path);
    return normalizeEndpoint(res.data as AutomationEndpoint);
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/automation/endpoints/${id}`);
  }

  async getAnalytics(id: string): Promise<EndpointAnalytics> {
    const res = await apiClient.get<EndpointAnalytics>(`/automation/endpoints/${id}/analytics`);
    return res.data as EndpointAnalytics;
  }

  async invokeTest(id: string, body: Record<string, unknown>): Promise<InvokeResult> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
    const tokens = (await import("@/store/auth-store")).useAuthStore.getState().tokens;
    const response = await fetch(`${API_BASE_URL}/automation/endpoints/${id}/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const json = (await response.json()) as Record<string, unknown>;
    return {
      success: response.ok && json.success !== false,
      statusCode: response.status,
      latencyMs: 0,
      body: json,
    };
  }
}

export const endpointRepositoryApi = new ApiEndpointRepository();

function normalizeEndpoint(ep: AutomationEndpoint): AutomationEndpoint {
  return {
    ...ep,
    webhook: {
      url: ep.webhook?.url?.trim() ?? "",
      isEnabled: Boolean(ep.webhook?.isEnabled),
      secret: ep.webhook?.secret ?? "",
    },
  };
}
