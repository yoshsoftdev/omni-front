import type { ActionConfig, ActionType } from "@/features/automation/types/action";

export type EndpointStatus = "active" | "disabled";

export interface EndpointStats {
  totalCalls: number;
  successRate: number;
  failedCalls: number;
  callsToday: number;
  averageLatencyMs: number;
}

/** Outbound callback URL notified after each Automation invoke. */
export interface EndpointWebhookConfig {
  url: string;
  isEnabled: boolean;
  /** Signing secret for X-Omni-Signature-256. Empty on write rotates/generates a new secret. */
  secret?: string;
}

export interface AutomationEndpoint {
  id: string;
  workspaceId: string;
  name: string;
  /** Display / search label only — never used in the public URL. */
  slug: string;
  description: string;
  method: "POST";
  status: EndpointStatus;
  actionType: ActionType;
  actionConfig: ActionConfig;
  /** Legacy endpoint invoke callback — not used by inbound forward Webhooks UI. */
  webhook?: EndpointWebhookConfig;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  stats: EndpointStats;
}

export interface CreateEndpointInput {
  name: string;
  slug: string;
  description: string;
  actionType: ActionType;
  actionConfig: ActionConfig;
  webhook?: EndpointWebhookConfig;
}

export interface UpdateEndpointInput {
  name?: string;
  slug?: string;
  description?: string;
  actionConfig?: ActionConfig;
  status?: EndpointStatus;
  webhook?: EndpointWebhookConfig;
}

export interface EndpointListQuery {
  search?: string;
  status?: EndpointStatus | "all";
  actionType?: ActionType | "all";
  page?: number;
  pageSize?: number;
}

export interface EndpointListPage {
  items: AutomationEndpoint[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AutomationSummary {
  endpointCount: number;
  requestsToday: number;
  successRate: number;
  failedToday: number;
  apiKeyCount: number;
}
