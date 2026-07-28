import { endpointRepositoryApi } from "@/features/automation/repositories/endpoint.repository.api";
import type { EndpointAnalytics, InvokeResult } from "@/features/automation/types/analytics";
import type {
  AutomationEndpoint,
  AutomationSummary,
  CreateEndpointInput,
  EndpointListPage,
  EndpointListQuery,
  UpdateEndpointInput,
} from "@/features/automation/types/endpoint";

export interface EndpointRepository {
  getSummary(): Promise<AutomationSummary>;
  list(query?: EndpointListQuery): Promise<EndpointListPage>;
  getById(id: string): Promise<AutomationEndpoint | undefined>;
  create(input: CreateEndpointInput): Promise<AutomationEndpoint>;
  update(id: string, patch: UpdateEndpointInput): Promise<AutomationEndpoint>;
  duplicate(id: string): Promise<AutomationEndpoint>;
  setStatus(id: string, status: "active" | "disabled"): Promise<AutomationEndpoint>;
  remove(id: string): Promise<void>;
  getAnalytics(id: string): Promise<EndpointAnalytics>;
  invokeTest(id: string, body: Record<string, unknown>): Promise<InvokeResult>;
}

/** Uses live Automation APIs. Mock remains available for local UI demos. */
export function getEndpointRepository(): EndpointRepository {
  return endpointRepositoryApi;
}
