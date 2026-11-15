"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionTypeLabel } from "@/features/automation/actions/registry";
import { AutomationNav } from "@/features/automation/components/automation-nav";
import { CopyButton } from "@/features/automation/components/shared/copy-button";
import { EndpointUrlField } from "@/features/automation/components/shared/endpoint-url-field";
import { VariableMappingTable } from "@/features/automation/components/wizard/variable-mapping-table";
import { endpointService } from "@/features/automation/services/endpoint.service";
import type { EndpointAnalytics, InvokeResult } from "@/features/automation/types/analytics";
import type { AutomationEndpoint } from "@/features/automation/types/endpoint";
import type { VariableMapping } from "@/features/automation/types/action";
import {
  endpointInvokeUrl,
  formatNumber,
  formatRelativeTime,
  successRateTone,
} from "@/features/automation/utils/format";
import {
  generateSnippet,
  SNIPPET_LANGUAGES,
  type SnippetLanguage,
} from "@/features/automation/utils/snippets";
import {
  buildExampleRequestBody,
  isSendTemplateConfig,
  isSendTextConfig,
} from "@/features/automation/utils/variable-defaults";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/shared/empty-state";
import { formatApiErrorMessage, isNotFound } from "@/services/api/errors";

type DetailTab = "overview" | "documentation" | "code" | "variables" | "analytics" | "test";

const TABS: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "documentation", label: "Documentation" },
  { id: "code", label: "Code Samples" },
  { id: "variables", label: "Variables" },
  { id: "analytics", label: "Analytics" },
  { id: "test", label: "Test" },
];

export function EndpointDetailPage({ endpointId }: { endpointId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify, Toast } = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const initialTab = (searchParams.get("tab") as DetailTab) || "overview";
  const [tab, setTab] = useState<DetailTab>(
    TABS.some((t) => t.id === initialTab) ? initialTab : "overview",
  );
  const [endpoint, setEndpoint] = useState<AutomationEndpoint | null>(null);
  const [analytics, setAnalytics] = useState<EndpointAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingVars, setEditingVars] = useState(false);
  const [draftMappings, setDraftMappings] = useState<VariableMapping[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const ep = await endpointService.getById(endpointId);
      if (!ep) {
        setEndpoint(null);
        return;
      }
      setEndpoint(ep);
      if (isSendTemplateConfig(ep.actionConfig)) {
        setDraftMappings(ep.actionConfig.variableMappings);
      }
    } catch (err) {
      if (isNotFound(err)) setEndpoint(null);
      else setLoadError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [endpointId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab !== "analytics" || !endpoint) return;
    void endpointService.getAnalytics(endpoint.id).then(setAnalytics);
  }, [endpoint, tab]);

  const mappings = useMemo(() => {
    if (!endpoint || !isSendTemplateConfig(endpoint.actionConfig)) return [];
    return endpoint.actionConfig.variableMappings;
  }, [endpoint]);

  const exampleBody = useMemo(() => {
    if (!endpoint) {
      return { to: "+6281234567890" };
    }
    if (isSendTextConfig(endpoint.actionConfig)) {
      const key = endpoint.actionConfig.textParameter?.trim() || "text";
      return {
        to: "+6281234567890",
        [key]: endpoint.actionConfig.defaultText?.trim() || "<text>",
      };
    }
    if (!isSendTemplateConfig(endpoint.actionConfig)) {
      return { to: "+6281234567890" };
    }
    return buildExampleRequestBody(
      endpoint.actionConfig.variableMappings,
      endpoint.actionConfig.recipientMode,
    );
  }, [endpoint]);

  async function handleDisable() {
    if (!endpoint) return;
    await endpointService.disable(endpoint.id);
    notify("success", "Endpoint disabled");
    void load();
  }

  async function handleEnable() {
    if (!endpoint) return;
    await endpointService.enable(endpoint.id);
    notify("success", "Endpoint enabled");
    void load();
  }

  async function handleDelete() {
    if (!endpoint) return;
    if (!(await confirm({ title: "Delete endpoint?", description: `"${endpoint.name}" and its configuration are removed permanently.` }))) return;
    await endpointService.remove(endpoint.id);
    notify("success", "Endpoint deleted");
    router.push("/automation/endpoints");
  }

  async function saveVariables() {
    if (!endpoint || !isSendTemplateConfig(endpoint.actionConfig)) return;
    await endpointService.update(endpoint.id, {
      actionConfig: {
        ...endpoint.actionConfig,
        variableMappings: draftMappings,
      },
    });
    setEditingVars(false);
    notify("success", "Variables updated");
    void load();
  }

  // A refresh (e.g. after a test send) keeps the page mounted so panels keep their state.
  if (loading && !endpoint) {
    return (
      <div className="space-y-6">
        <AutomationNav />
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <AutomationNav />
        <ErrorState message={loadError} onRetry={() => void load()} />
      </div>
    );
  }

  if (!endpoint) {
    return (
      <div className="space-y-6">
        <AutomationNav />
        <p className="text-muted-foreground">Endpoint not found.</p>
        <Button asChild variant="outline">
          <Link href="/automation/endpoints">Back to endpoints</Link>
        </Button>
      </div>
    );
  }

  const templateName = isSendTemplateConfig(endpoint.actionConfig)
    ? endpoint.actionConfig.templateName
    : "—";

  return (
    <div className="space-y-6">
      <AutomationNav />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/automation/endpoints">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <PageHeader title={endpoint.name} description={endpoint.description || undefined} />
            <StatusBadge status={endpoint.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            slug: <code className="font-mono text-xs">{endpoint.slug}</code> ·{" "}
            {actionTypeLabel(endpoint.actionType)} · {templateName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {endpoint.status === "active" ? (
            <Button type="button" variant="outline" onClick={() => void handleDisable()}>
              Disable
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => void handleEnable()}>
              Enable
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto border-b">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "shrink-0 pb-3 text-sm transition-colors",
              tab === item.id
                ? "border-b-2 border-primary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-4">
          <EndpointUrlField endpointId={endpoint.id} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Last used" value={formatRelativeTime(endpoint.lastUsedAt)} />
            <StatCard label="Created" value={formatRelativeTime(endpoint.createdAt)} />
            <StatCard label="Updated" value={formatRelativeTime(endpoint.updatedAt)} />
            <StatCard label="Authentication" value="Bearer Automation API key" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Total calls" value={formatNumber(endpoint.stats.totalCalls)} />
            <StatCard
              label="Success rate"
              value={`${endpoint.stats.successRate}%`}
              badge={<StatusBadge tone={successRateTone(endpoint.stats.successRate)}>{endpoint.stats.successRate}%</StatusBadge>}
            />
            <StatCard label="Avg latency" value={`${endpoint.stats.averageLatencyMs || "—"} ms`} />
          </div>
        </div>
      ) : null}

      {tab === "documentation" ? (
        <DocumentationPanel
          endpoint={endpoint}
          exampleBody={exampleBody}
          onInvoked={() => void load()}
        />
      ) : null}

      {tab === "code" ? (
        <CodeExamplesPanel url={endpointInvokeUrl(endpoint.id)} body={exampleBody} />
      ) : null}

      {tab === "variables" ? (
        <div className="space-y-4">
          {isSendTemplateConfig(endpoint.actionConfig) ? (
            <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium">Variable mapping</h3>
              <p className="text-sm text-muted-foreground">
                Template variables map to the JSON body your integrators send.
              </p>
            </div>
            {editingVars ? (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setEditingVars(false); setDraftMappings(mappings); }}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void saveVariables()}>
                  Save
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => setEditingVars(true)}>
                Edit
              </Button>
            )}
          </div>
          <VariableMappingTable
            mappings={editingVars ? draftMappings : mappings}
            onChange={editingVars ? setDraftMappings : undefined}
            readOnly={!editingVars}
          />
            </>
          ) : (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              This endpoint does not use template variables.
            </div>
          )}
        </div>
      ) : null}

      {tab === "analytics" ? (
        <AnalyticsPanel analytics={analytics} />
      ) : null}

      {tab === "test" ? (
        <TestEndpointPanel
          endpoint={endpoint}
          mappings={mappings}
          onInvoked={() => void load()}
        />
      ) : null}

      {confirmDialog}
      <Toast />
    </div>
  );
}

function StatCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-sm font-semibold">{value}</p>
        {badge}
      </div>
    </div>
  );
}

function DocumentationPanel({
  endpoint,
  exampleBody,
  onInvoked,
}: {
  endpoint: AutomationEndpoint;
  exampleBody: Record<string, string>;
  onInvoked: () => void;
}) {
  const [payload, setPayload] = useState(JSON.stringify(exampleBody, null, 2));
  const [result, setResult] = useState<InvokeResult | null>(null);
  const [running, setRunning] = useState(false);
  const [confirmBody, setConfirmBody] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setPayload(JSON.stringify(exampleBody, null, 2));
  }, [exampleBody]);

  function askToRun() {
    try {
      setConfirmBody(JSON.parse(payload) as Record<string, unknown>);
    } catch {
      setResult({ success: false, statusCode: 400, latencyMs: 0, body: { success: false, message: "Invalid JSON payload" } });
    }
  }

  async function run(body: Record<string, unknown>) {
    setRunning(true);
    try {
      setResult(await endpointService.invokeTest(endpoint.id, body));
      onInvoked();
    } catch (err) {
      setResult({ success: false, statusCode: 0, latencyMs: 0, body: { success: false, message: formatApiErrorMessage(err) } });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <EndpointUrlField endpointId={endpoint.id} />
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-medium">Request schema</h3>
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Field</DataTableHeaderCell>
                <DataTableHeaderCell>Type</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {Object.keys(exampleBody).map((key) => (
                <DataTableRow key={key}>
                  <DataTableCell className="font-mono text-xs">{key}</DataTableCell>
                  <DataTableCell className="text-muted-foreground">string</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-medium">Success response</h3>
          <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
            {JSON.stringify(
              {
                success: true,
                data: { executionId: "exec_…", status: "queued" },
              },
              null,
              2,
            )}
          </pre>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-medium">Error responses</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>401 — Missing or invalid API key</li>
            <li>403 — Endpoint or key disabled</li>
            <li>404 — Endpoint not found</li>
            <li>422 — Validation error</li>
            <li>429 — Rate limited</li>
          </ul>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium">Try It</h3>
          <CopyButton value={payload} label="Copy payload" />
        </div>
        <textarea
          aria-label="Request payload"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={12}
          className="w-full rounded-md border bg-background p-3 font-mono text-xs"
        />
        <RealSendNotice />
        <Button type="button" disabled={running} onClick={askToRun}>
          {running ? "Sending…" : "Send real test message"}
        </Button>
        <ConfirmRealSend
          to={confirmBody ? String(confirmBody.to ?? "") : ""}
          open={confirmBody !== null}
          onOpenChange={(open) => !open && setConfirmBody(null)}
          onConfirm={() => (confirmBody ? run(confirmBody) : undefined)}
        />
        {result ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <StatusBadge tone={result.success ? "success" : "error"}>
                {result.statusCode}
              </StatusBadge>
              <span className="text-muted-foreground">{result.latencyMs} ms</span>
            </div>
            <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
              {JSON.stringify(result.body, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CodeExamplesPanel({
  url,
  body,
}: {
  url: string;
  body: Record<string, unknown>;
}) {
  const [language, setLanguage] = useState<SnippetLanguage>("curl");
  const snippet = generateSnippet({ language, url, body });

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {SNIPPET_LANGUAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLanguage(item.id)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs",
              language === item.id ? "border-primary bg-muted font-medium" : "text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <CopyButton value={snippet} />
      </div>
      <pre className="overflow-x-auto rounded-md border bg-muted/30 p-4 font-mono text-xs leading-relaxed">
        {snippet}
      </pre>
    </div>
  );
}

function AnalyticsPanel({ analytics }: { analytics: EndpointAnalytics | null }) {
  if (!analytics) {
    return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Calls today" value={formatNumber(analytics.callsToday)} />
        <StatCard label="Total requests" value={formatNumber(analytics.totalRequests)} />
        <StatCard label="Success rate" value={`${analytics.successRate}%`} />
        <StatCard label="Failed requests" value={formatNumber(analytics.failedRequests)} />
        <StatCard label="Average latency" value={`${analytics.averageLatencyMs} ms`} />
        <StatCard label="Last used" value={formatRelativeTime(analytics.lastUsedAt)} />
      </div>

      {analytics.lastError ? (
        <div className="rounded-lg border border-error-border bg-error-muted px-4 py-3 text-sm text-error-foreground">
          <p className="font-medium">Last error · {analytics.lastError.statusCode}</p>
          <p className="mt-1">{analytics.lastError.message}</p>
          <p className="mt-1 text-xs opacity-80">{formatRelativeTime(analytics.lastError.at)}</p>
        </div>
      ) : null}

      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-medium">Requests (7 days)</h3>
        <div className="space-y-2">
          {analytics.requestsOverTime.map((row) => {
            const total = row.success + row.failed || 1;
            return (
              <div key={row.date} className="grid grid-cols-[64px_1fr_80px] items-center gap-3 text-xs">
                <span className="text-muted-foreground">{row.date}</span>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div className="bg-success" style={{ width: `${(row.success / total) * 100}%` }} />
                  <div className="bg-destructive" style={{ width: `${(row.failed / total) * 100}%` }} />
                </div>
                <span className="text-right text-muted-foreground">
                  {row.success}/{row.failed}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-medium">Top client IPs</h3>
        <DataTable>
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>IP</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Requests</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {analytics.topClientIps.map((row) => (
              <DataTableRow key={row.ip}>
                <DataTableCell className="font-mono text-xs">{row.ip}</DataTableCell>
                <DataTableCell className="text-right">{formatNumber(row.count)}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </div>
    </div>
  );
}

function TestEndpointPanel({
  endpoint,
  mappings,
  onInvoked,
}: {
  endpoint: AutomationEndpoint;
  mappings: VariableMapping[];
  onInvoked: () => void;
}) {
  const [to, setTo] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const textParameter =
    isSendTextConfig(endpoint.actionConfig) && endpoint.actionConfig.textParameter.trim()
      ? endpoint.actionConfig.textParameter.trim()
      : "text";
  const [values, setValues] = useState<Record<string, string>>(() =>
    isSendTextConfig(endpoint.actionConfig)
      ? { [textParameter]: endpoint.actionConfig.defaultText ?? "" }
      : Object.fromEntries(mappings.map((m) => [m.apiParameter, m.defaultValue ?? ""])),
  );
  const [result, setResult] = useState<InvokeResult | null>(null);
  const [running, setRunning] = useState(false);

  async function sendTest() {
    setRunning(true);
    try {
      setResult(await endpointService.invokeTest(endpoint.id, { to, ...values }));
      onInvoked();
    } catch (err) {
      setResult({ success: false, statusCode: 0, latencyMs: 0, body: { success: false, message: formatApiErrorMessage(err) } });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div>
          <h3 className="font-medium">Test Endpoint</h3>
          <p className="text-sm text-muted-foreground">
            Fill the form generated from your variable mappings and send a test request.
          </p>
        </div>
        <RealSendNotice />
        <div className="space-y-2">
          <Label htmlFor="test-to">Phone Number</Label>
          <Input id="test-to" placeholder="+6281234567890" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {isSendTextConfig(endpoint.actionConfig) ? (
          <div className="space-y-2">
            <Label htmlFor={`test-${textParameter}`}>{textParameter}</Label>
            <Input
              id={`test-${textParameter}`}
              value={values[textParameter] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [textParameter]: e.target.value }))}
            />
          </div>
        ) : null}
        {mappings.map((mapping) => (
          <div key={mapping.apiParameter} className="space-y-2">
            <Label htmlFor={`test-${mapping.apiParameter}`}>
              {mapping.apiParameter}
              {mapping.required ? " *" : ""}
            </Label>
            {mapping.description ? (
              <p className="text-xs text-muted-foreground">{mapping.description}</p>
            ) : null}
            <Input
              id={`test-${mapping.apiParameter}`}
              value={values[mapping.apiParameter] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [mapping.apiParameter]: e.target.value }))
              }
            />
          </div>
        ))}
        <Button type="button" disabled={running || !to.trim()} onClick={() => setConfirmOpen(true)}>
          {running ? "Sending…" : "Send real test message"}
        </Button>
        <ConfirmRealSend to={to} open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={sendTest} />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-medium">Response</h3>
        {result ? (
          <div className="space-y-2">
            <StatusBadge tone={result.success ? "success" : "error"}>{result.statusCode}</StatusBadge>
            <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
              {JSON.stringify(result.body, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Run a test to see the live response.</p>
        )}
      </div>
    </div>
  );
}

/** The test endpoints call the production invoker: a real message goes out. */
function RealSendNotice() {
  return (
    <div className="rounded-md border border-warning-border bg-warning-muted px-3 py-2 text-xs text-warning-foreground">
      This sends a real WhatsApp message to the phone number, through this endpoint&apos;s channel. Meta may bill it,
      and it is recorded as an execution. Your session authorizes it; no API key is needed.
    </div>
  );
}

function ConfirmRealSend({
  to,
  open,
  onOpenChange,
  onConfirm,
}: {
  to: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title="Send a real message?"
      description={`A real WhatsApp message goes to ${to.trim() || "the number in the payload"}.`}
      confirmLabel="Send"
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}
