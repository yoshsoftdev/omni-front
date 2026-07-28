import type { AutomationApiKey } from "@/features/automation/types/api-key";
import type { AutomationEndpoint, AutomationSummary } from "@/features/automation/types/endpoint";
import type { EndpointAnalytics } from "@/features/automation/types/analytics";

const WORKSPACE_ID = "ws_demo";

export const MOCK_ENDPOINTS: AutomationEndpoint[] = [
  {
    id: "ept_01JV8XK2M4N7P9QR",
    workspaceId: WORKSPACE_ID,
    name: "Send Invoice",
    slug: "send-invoice",
    description: "Notify customers when a new invoice is issued.",
    method: "POST",
    status: "active",
    actionType: "send_template",
    actionConfig: {
      templateId: "tpl_2",
      templateName: "order_confirmation_v2",
      recipientMode: "phone",
      variableMappings: [
        {
          templateVariable: "1",
          apiParameter: "customerName",
          required: true,
          description: "Customer full name",
        },
        {
          templateVariable: "2",
          apiParameter: "invoiceNumber",
          required: true,
          description: "Invoice reference",
        },
      ],
    },
    createdAt: "2026-03-01T08:00:00Z",
    updatedAt: "2026-07-20T10:00:00Z",
    lastUsedAt: "2026-07-27T06:12:00Z",
    webhook: {
      url: "https://hooks.example.com/omni/invoice",
      isEnabled: true,
      secret: "whsec_demo_invoice",
    },
    stats: {
      totalCalls: 12420,
      successRate: 99.2,
      failedCalls: 99,
      callsToday: 412,
      averageLatencyMs: 186,
    },
  },
  {
    id: "ept_01JV9AB3C5D8E1FG",
    workspaceId: WORKSPACE_ID,
    name: "Shipping Update",
    slug: "shipping-update",
    description: "Push delivery ETA updates from the warehouse system.",
    method: "POST",
    status: "active",
    actionType: "send_template",
    actionConfig: {
      templateId: "tpl_3",
      templateName: "shipping_update",
      recipientMode: "phone",
      variableMappings: [
        {
          templateVariable: "1",
          apiParameter: "etaDate",
          required: true,
          description: "Estimated arrival date",
        },
      ],
    },
    createdAt: "2026-04-12T08:00:00Z",
    updatedAt: "2026-07-18T09:00:00Z",
    lastUsedAt: "2026-07-27T05:40:00Z",
    webhook: {
      url: "",
      isEnabled: false,
    },
    stats: {
      totalCalls: 8840,
      successRate: 98.7,
      failedCalls: 115,
      callsToday: 290,
      averageLatencyMs: 201,
    },
  },
  {
    id: "ept_01JVAK4L6M0N2P3Q",
    workspaceId: WORKSPACE_ID,
    name: "Welcome Series",
    slug: "welcome-series",
    description: "Triggered by CRM when a new customer is created.",
    method: "POST",
    status: "disabled",
    actionType: "send_template",
    actionConfig: {
      templateId: "tpl_4",
      templateName: "welcome_new_customer",
      recipientMode: "phone",
      variableMappings: [
        {
          templateVariable: "1",
          apiParameter: "customerName",
          required: true,
          description: "Customer full name",
        },
        {
          templateVariable: "2",
          apiParameter: "discountPercent",
          required: true,
          defaultValue: "10",
          description: "Welcome discount percentage",
        },
      ],
    },
    createdAt: "2026-05-01T08:00:00Z",
    updatedAt: "2026-07-01T12:00:00Z",
    lastUsedAt: "2026-06-30T18:00:00Z",
    webhook: {
      url: "https://hooks.example.com/omni/welcome",
      isEnabled: false,
      secret: "whsec_demo_welcome",
    },
    stats: {
      totalCalls: 2104,
      successRate: 97.1,
      failedCalls: 61,
      callsToday: 0,
      averageLatencyMs: 220,
    },
  },
];

export const MOCK_API_KEYS: AutomationApiKey[] = [
  {
    id: "key_01ERP",
    name: "ERP",
    keyPrefix: "oc_auto_k9f2",
    scopes: ["send_template"],
    status: "active",
    lastUsedAt: "2026-07-27T06:12:00Z",
    createdAt: "2026-01-12T08:00:00Z",
  },
  {
    id: "key_02N8N",
    name: "n8n",
    keyPrefix: "oc_auto_m3a1",
    scopes: ["send_template", "contacts.read"],
    status: "active",
    lastUsedAt: "2026-07-27T04:00:00Z",
    createdAt: "2026-02-20T08:00:00Z",
  },
];

export function buildMockSummary(
  endpoints: AutomationEndpoint[],
  keys: AutomationApiKey[],
): AutomationSummary {
  const active = endpoints.filter((e) => e.status === "active");
  const requestsToday = endpoints.reduce((sum, e) => sum + e.stats.callsToday, 0);
  const failedToday = Math.round(
    endpoints.reduce((sum, e) => sum + e.stats.callsToday * ((100 - e.stats.successRate) / 100), 0),
  );
  const weighted =
    active.length === 0
      ? 100
      : active.reduce((sum, e) => sum + e.stats.successRate, 0) / active.length;
  return {
    endpointCount: endpoints.length,
    requestsToday,
    successRate: Math.round(weighted * 10) / 10,
    failedToday,
    apiKeyCount: keys.filter((k) => k.status === "active").length,
  };
}

export function buildMockAnalytics(endpoint: AutomationEndpoint): EndpointAnalytics {
  return {
    endpointId: endpoint.id,
    callsToday: endpoint.stats.callsToday,
    totalRequests: endpoint.stats.totalCalls,
    successRate: endpoint.stats.successRate,
    failedRequests: endpoint.stats.failedCalls,
    averageLatencyMs: endpoint.stats.averageLatencyMs,
    lastUsedAt: endpoint.lastUsedAt,
    lastError:
      endpoint.stats.failedCalls > 0
        ? {
            at: "2026-07-26T22:14:00Z",
            message: "Recipient phone number is invalid",
            statusCode: 422,
          }
        : null,
    topClientIps: [
      { ip: "103.24.12.8", count: Math.max(12, Math.floor(endpoint.stats.callsToday * 0.4)) },
      { ip: "18.142.55.9", count: Math.max(8, Math.floor(endpoint.stats.callsToday * 0.25)) },
      { ip: "35.201.10.4", count: Math.max(4, Math.floor(endpoint.stats.callsToday * 0.1)) },
    ],
    requestsOverTime: [
      { date: "Jul 21", success: 380, failed: 4 },
      { date: "Jul 22", success: 410, failed: 6 },
      { date: "Jul 23", success: 395, failed: 3 },
      { date: "Jul 24", success: 440, failed: 5 },
      { date: "Jul 25", success: 420, failed: 7 },
      { date: "Jul 26", success: 455, failed: 4 },
      { date: "Jul 27", success: Math.max(0, endpoint.stats.callsToday - 3), failed: 3 },
    ],
  };
}
