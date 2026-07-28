export interface EndpointAnalytics {
  endpointId: string;
  callsToday: number;
  totalRequests: number;
  successRate: number;
  failedRequests: number;
  averageLatencyMs: number;
  lastUsedAt: string | null;
  lastError: {
    at: string;
    message: string;
    statusCode: number;
  } | null;
  topClientIps: Array<{ ip: string; count: number }>;
  requestsOverTime: Array<{ date: string; success: number; failed: number }>;
}

export interface InvokeResult {
  success: boolean;
  statusCode: number;
  body: Record<string, unknown>;
  latencyMs: number;
}
