import {
  buildMockAnalytics,
  buildMockSummary,
  MOCK_API_KEYS,
  MOCK_ENDPOINTS,
} from "@/features/automation/mock/mock-data";
import type { EndpointRepository } from "@/features/automation/repositories/endpoint.repository";
import type { InvokeResult } from "@/features/automation/types/analytics";
import type {
  AutomationEndpoint,
  CreateEndpointInput,
  EndpointListPage,
  EndpointListQuery,
  UpdateEndpointInput,
} from "@/features/automation/types/endpoint";
import { slugify } from "@/features/automation/utils/slug";

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function newEndpointId(): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `ept_01JV${rand}`;
}

class MockEndpointRepository implements EndpointRepository {
  private endpoints: AutomationEndpoint[] = structuredClone(MOCK_ENDPOINTS);

  async getSummary() {
    await delay();
    return buildMockSummary(this.endpoints, MOCK_API_KEYS);
  }

  async list(query: EndpointListQuery = {}): Promise<EndpointListPage> {
    await delay();
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    let items = [...this.endpoints];

    if (query.status && query.status !== "all") {
      items = items.filter((e) => e.status === query.status);
    }
    if (query.actionType && query.actionType !== "all") {
      items = items.filter((e) => e.actionType === query.actionType);
    }
    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.slug.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q),
      );
    }

    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      pagination: { page, pageSize, total, totalPages },
    };
  }

  async getById(id: string) {
    await delay();
    return this.endpoints.find((e) => e.id === id);
  }

  async create(input: CreateEndpointInput) {
    await delay(280);
    const now = new Date().toISOString();
    const webhookUrl = input.webhook?.url?.trim() ?? "";
    const endpoint: AutomationEndpoint = {
      id: newEndpointId(),
      workspaceId: "ws_demo",
      name: input.name.trim(),
      slug: slugify(input.slug || input.name),
      description: input.description.trim(),
      method: "POST",
      status: "active",
      actionType: input.actionType,
      actionConfig: input.actionConfig,
      webhook: {
        url: webhookUrl,
        isEnabled: Boolean(input.webhook?.isEnabled && webhookUrl),
        secret:
          webhookUrl
            ? input.webhook?.secret?.trim() || `whsec_${Math.random().toString(36).slice(2, 14)}`
            : undefined,
      },
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
      stats: {
        totalCalls: 0,
        successRate: 100,
        failedCalls: 0,
        callsToday: 0,
        averageLatencyMs: 0,
      },
    };
    this.endpoints = [endpoint, ...this.endpoints];
    return endpoint;
  }

  async update(id: string, patch: UpdateEndpointInput) {
    await delay();
    const index = this.endpoints.findIndex((e) => e.id === id);
    if (index < 0) throw new Error("Endpoint not found");
    const current = this.endpoints[index];
    let webhook = current.webhook ?? { url: "", isEnabled: false };
    if (patch.webhook) {
      const url = patch.webhook.url?.trim() ?? "";
      if (!url) {
        webhook = { url: "", isEnabled: false };
      } else {
        const rotate = !patch.webhook.secret?.trim();
        webhook = {
          url,
          isEnabled: Boolean(patch.webhook.isEnabled),
          secret: rotate
            ? `whsec_${Math.random().toString(36).slice(2, 14)}`
            : patch.webhook.secret,
        };
      }
    }
    const next: AutomationEndpoint = {
      ...current,
      name: patch.name ?? current.name,
      description: patch.description ?? current.description,
      actionConfig: patch.actionConfig ?? current.actionConfig,
      status: patch.status ?? current.status,
      slug: patch.slug ? slugify(patch.slug) : current.slug,
      webhook,
      updatedAt: new Date().toISOString(),
    };
    this.endpoints[index] = next;
    return next;
  }

  async duplicate(id: string) {
    await delay();
    const source = this.endpoints.find((e) => e.id === id);
    if (!source) throw new Error("Endpoint not found");
    const now = new Date().toISOString();
    const copy: AutomationEndpoint = {
      ...structuredClone(source),
      id: newEndpointId(),
      name: `${source.name} (Copy)`,
      slug: `${source.slug}-copy`,
      status: "active",
      webhook: { url: "", isEnabled: false },
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
      stats: {
        totalCalls: 0,
        successRate: 100,
        failedCalls: 0,
        callsToday: 0,
        averageLatencyMs: 0,
      },
    };
    this.endpoints = [copy, ...this.endpoints];
    return copy;
  }

  async setStatus(id: string, status: "active" | "disabled") {
    return this.update(id, { status });
  }

  async remove(id: string) {
    await delay();
    this.endpoints = this.endpoints.filter((e) => e.id !== id);
  }

  async getAnalytics(id: string) {
    await delay();
    const endpoint = this.endpoints.find((e) => e.id === id);
    if (!endpoint) throw new Error("Endpoint not found");
    return buildMockAnalytics(endpoint);
  }

  async invokeTest(id: string, body: Record<string, unknown>): Promise<InvokeResult> {
    await delay(420);
    const endpoint = this.endpoints.find((e) => e.id === id);
    if (!endpoint) {
      return {
        success: false,
        statusCode: 404,
        latencyMs: 40,
        body: { success: false, message: "Endpoint not found" },
      };
    }
    if (endpoint.status === "disabled") {
      return {
        success: false,
        statusCode: 403,
        latencyMs: 35,
        body: { success: false, message: "Endpoint is disabled" },
      };
    }
    if (!body.to && !body.contactId && !body.conversationId) {
      return {
        success: false,
        statusCode: 422,
        latencyMs: 48,
        body: { success: false, message: "Recipient is required" },
      };
    }
    const now = new Date().toISOString();
    endpoint.lastUsedAt = now;
    endpoint.stats.totalCalls += 1;
    endpoint.stats.callsToday += 1;
    endpoint.updatedAt = now;
    return {
      success: true,
      statusCode: 200,
      latencyMs: 180 + Math.floor(Math.random() * 80),
      body: {
        success: true,
        data: {
          executionId: `exec_${Date.now()}`,
          status: "queued",
          endpointId: endpoint.id,
        },
      },
    };
  }
}

export const endpointRepositoryMock = new MockEndpointRepository();
