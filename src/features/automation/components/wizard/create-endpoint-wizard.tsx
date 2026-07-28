"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACTION_TYPE_REGISTRY } from "@/features/automation/actions/registry";
import { AutomationNav } from "@/features/automation/components/automation-nav";
import { VariableMappingTable } from "@/features/automation/components/wizard/variable-mapping-table";
import { endpointService } from "@/features/automation/services/endpoint.service";
import type { ActionType, RecipientMode } from "@/features/automation/types/action";
import type { SendTemplateActionConfig, SendTextActionConfig } from "@/features/automation/types/action";
import { endpointInvokeUrl } from "@/features/automation/utils/format";
import { isValidSlug, slugify } from "@/features/automation/utils/slug";
import {
  buildDefaultVariableMappings,
  buildExampleRequestBody,
} from "@/features/automation/utils/variable-defaults";
import { WhatsAppMessagePreview } from "@/features/broadcast/components/shared/whatsapp-message-preview";
import { MOCK_TEMPLATES } from "@/features/broadcast/mock/template-mock-data";
import { templateQueryService } from "@/features/broadcast/services/template-query.service";
import type { Template } from "@/features/broadcast/types/template";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import {
  countTemplateVariables,
  resolveTemplatePreview,
  templatePreviewHeaderType,
} from "@/features/broadcast/utils/template-preview";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useEndpointWizardStore,
  type EndpointWizardStep,
} from "@/store/endpoint-wizard-store";

const STEPS: { step: EndpointWizardStep; label: string }[] = [
  { step: 1, label: "General" },
  { step: 2, label: "Action" },
  { step: 3, label: "Template" },
  { step: 4, label: "Recipient" },
  { step: 5, label: "Variables" },
  { step: 6, label: "Review" },
];

const TEMPLATE_PAGE_SIZE = 8;

function Stepper({ activeStep }: { activeStep: EndpointWizardStep }) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-2">
      {STEPS.map((s) => {
        const done = activeStep > s.step;
        const active = activeStep === s.step;
        return (
          <div key={s.step} className="flex shrink-0 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-sm",
                done && "border-primary bg-primary text-primary-foreground",
                active && !done && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : s.step}
            </div>
            <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CreateEndpointWizard() {
  const router = useRouter();
  const { notify, Toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templatePage, setTemplatePage] = useState(1);
  const [slugTouched, setSlugTouched] = useState(false);
  const [sendTextChannelId, setSendTextChannelId] = useState("");
  const [sendTextParameter, setSendTextParameter] = useState("text");
  const [sendTextDefault, setSendTextDefault] = useState("");

  const {
    step,
    name,
    description,
    slug,
    actionType,
    templateId,
    templateName,
    recipientMode,
    variableMappings,
    setStep,
    setName,
    setDescription,
    setSlug,
    setActionType,
    setTemplate,
    setRecipientMode,
    setVariableMappings,
    reset,
  } = useEndpointWizardStore();

  useEffect(() => () => reset(), [reset]);

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugify(name));
    }
  }, [name, setSlug, slugTouched]);

  const templatesQuery = useQuery({
    queryKey: ["automation-templates"],
    queryFn: async () => {
      try {
        const items = await templateQueryService.getTemplates();
        return items.length > 0 ? items : MOCK_TEMPLATES;
      } catch {
        return MOCK_TEMPLATES;
      }
    },
  });
  const channelsQuery = useQuery({
    queryKey: ["automation-send-text-channels"],
    queryFn: async () => {
      const channels = await channelQueryService.getConnectedChannels();
      return channels.filter((c) => c.channel_type === "whatsapp");
    },
  });

  const approvedTemplates = useMemo(() => {
    const items = (templatesQuery.data ?? []).filter((t) => t.status === "APPROVED");
    if (!templateSearch.trim()) return items;
    const q = templateSearch.toLowerCase();
    return items.filter(
      (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
    );
  }, [templateSearch, templatesQuery.data]);

  const templateTotalPages = Math.max(1, Math.ceil(approvedTemplates.length / TEMPLATE_PAGE_SIZE));
  const pagedTemplates = approvedTemplates.slice(
    (templatePage - 1) * TEMPLATE_PAGE_SIZE,
    templatePage * TEMPLATE_PAGE_SIZE,
  );
  const selectedTemplate = (templatesQuery.data ?? []).find((t) => t.id === templateId);

  function validateStep(current: EndpointWizardStep): string | null {
    if (current === 1) {
      if (!name.trim()) return "Endpoint name is required";
      if (!isValidSlug(slug)) return "Slug must be kebab-case (e.g. send-invoice)";
      return null;
    }
    if (current === 2) {
      if (actionType !== "send_template" && actionType !== "send_text") return "Select an action";
      return null;
    }
    if (current === 3) {
      if (actionType === "send_text") {
        if (!sendTextChannelId) return "Select a connected WhatsApp channel";
        if (!sendTextParameter.trim()) return "Text parameter is required";
        return null;
      }
      if (!templateId) return "Select an approved WhatsApp template";
      return null;
    }
    if (current === 4) {
      if (recipientMode !== "phone") return "Phone Number is the only supported recipient mode";
      return null;
    }
    if (current === 5) {
      if (actionType !== "send_template") return null;
      const names = variableMappings.map((m) => m.apiParameter.trim());
      if (names.some((n) => !n)) return "All API parameters need a name";
      if (new Set(names).size !== names.length) return "API parameter names must be unique";
      return null;
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep(Math.min(6, step + 1) as EndpointWizardStep);
  }

  function goBack() {
    setError(null);
    setStep(Math.max(1, step - 1) as EndpointWizardStep);
  }

  function selectTemplate(template: Template) {
    setTemplate(template.id, template.name, buildDefaultVariableMappings(template));
  }

  async function handleCreate() {
    const message = validateStep(5) ?? validateStep(1) ?? validateStep(2) ?? validateStep(3);
    if (message) {
      setError(message);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const actionConfig =
        actionType === "send_text"
          ? ({
              channelId: sendTextChannelId,
              recipientMode: "phone",
              textParameter: sendTextParameter.trim() || "text",
              defaultText: sendTextDefault.trim() || undefined,
            } satisfies SendTextActionConfig)
          : ({
              templateId,
              templateName,
              recipientMode,
              variableMappings,
            } satisfies SendTemplateActionConfig);
      const created = await endpointService.create({
        name,
        slug,
        description,
        actionType: actionType as ActionType,
        actionConfig,
      });
      reset();
      notify("success", "Endpoint created");
      router.push(`/automation/endpoints/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create endpoint");
    } finally {
      setSubmitting(false);
    }
  }

  const exampleBody =
    actionType === "send_text"
      ? {
          to: "+6281234567890",
          [sendTextParameter.trim() || "text"]: sendTextDefault.trim() || "<text>",
        }
      : buildExampleRequestBody(variableMappings, recipientMode);

  return (
    <div className="space-y-6">
      <AutomationNav />
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/automation/endpoints">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <PageHeader
          title="Create Endpoint"
          description="Turn an Action into an immutable HTTP API your systems can call."
        />
      </div>

      <Stepper activeStep={step} />

      {error ? (
        <div className="rounded-lg border border-error-border bg-error-muted px-4 py-3 text-sm text-error-foreground">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border bg-card p-5">
        {step === 1 ? (
          <div className="mx-auto max-w-xl space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ep-name">Endpoint Name</Label>
              <Input
                id="ep-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Send Invoice"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-desc">Description</Label>
              <textarea
                id="ep-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What does this endpoint do?"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>HTTP Method</Label>
              <div>
                <StatusBadge tone="info">POST</StatusBadge>
                <p className="mt-1 text-xs text-muted-foreground">Only POST is supported in v1.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-slug">Slug (display only)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/</span>
                <Input
                  id="ep-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="send-invoice"
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for search and readability. The public URL uses an immutable endpoint ID.
              </p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {ACTION_TYPE_REGISTRY.map((action) => {
              const selected = actionType === action.type;
              return (
                <button
                  key={action.type}
                  type="button"
                  disabled={!action.available}
                  onClick={() => setActionType(action.type)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    selected && "border-primary bg-muted/40",
                    !action.available && "cursor-not-allowed opacity-60",
                    action.available && !selected && "hover:bg-accent/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{action.label}</p>
                    {action.badge ? <StatusBadge tone="warning">{action.badge}</StatusBadge> : null}
                    {selected ? <StatusBadge tone="success">Selected</StatusBadge> : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {actionType === "send_text" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="send-text-channel">WhatsApp Channel</Label>
                  <select
                    id="send-text-channel"
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    value={sendTextChannelId}
                    onChange={(e) => setSendTextChannelId(e.target.value)}
                  >
                    <option value="">Select channel</option>
                    {(channelsQuery.data ?? []).map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="send-text-parameter">Text Parameter</Label>
                  <Input
                    id="send-text-parameter"
                    value={sendTextParameter}
                    onChange={(e) => setSendTextParameter(e.target.value)}
                    placeholder="text"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="send-text-default">Default Text (optional)</Label>
                  <textarea
                    id="send-text-default"
                    value={sendTextDefault}
                    onChange={(e) => setSendTextDefault(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={templateSearch}
                  onChange={(e) => {
                    setTemplateSearch(e.target.value);
                    setTemplatePage(1);
                  }}
                  placeholder="Search approved templates…"
                  className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {pagedTemplates.map((template) => {
                  const selected = template.id === templateId;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => selectTemplate(template)}
                      className={cn(
                        "rounded-lg border p-3 text-left hover:bg-accent/30",
                        selected && "border-primary bg-muted/30",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{template.name}</p>
                        <StatusBadge status={template.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {template.category} · {template.language_label} · {countTemplateVariables(template.body)} vars ·{" "}
                        {template.header.type}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{template.preview}</p>
                    </button>
                  );
                })}
              </div>
              <PaginationFooter
                start={approvedTemplates.length === 0 ? 0 : (templatePage - 1) * TEMPLATE_PAGE_SIZE + 1}
                end={Math.min(templatePage * TEMPLATE_PAGE_SIZE, approvedTemplates.length)}
                total={approvedTemplates.length}
                totalLabel="templates"
                currentPage={templatePage}
                totalPages={templateTotalPages}
                onPageChange={setTemplatePage}
              />
            </div>
            )}
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="mb-3 text-sm font-medium">Preview</p>
              {actionType === "send_text" ? (
                <p className="text-sm text-muted-foreground">
                  Free-text endpoint sends body field{" "}
                  <code className="font-mono">{sendTextParameter || "text"}</code> within the 24h customer
                  care window.
                </p>
              ) : selectedTemplate ? (
                <WhatsAppMessagePreview
                  deviceName="Omni Chan"
                  languageLabel={selectedTemplate.language_label}
                  headerType={templatePreviewHeaderType(selectedTemplate.header.type) ?? "none"}
                  headerText={selectedTemplate.header.title}
                  body={resolveTemplatePreview(selectedTemplate)}
                  footer={selectedTemplate.footer}
                  buttons={selectedTemplate.buttons.map((b) => ({
                    id: b.id,
                    text: b.text,
                    type: b.type,
                  }))}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Select a template to preview.</p>
              )}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mx-auto max-w-lg space-y-3">
            {(
              [
                { value: "phone", label: "Phone Number", available: true, help: "Caller provides to in the request body." },
                { value: "contact_id", label: "Contact ID", available: false, help: "Resolve recipient from Omni Chan contacts." },
                {
                  value: "conversation_id",
                  label: "Conversation ID",
                  available: false,
                  help: "Send into an existing inbox conversation.",
                },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={!option.available}
                onClick={() => setRecipientMode(option.value as RecipientMode)}
                className={cn(
                  "flex w-full items-start justify-between rounded-lg border p-4 text-left",
                  recipientMode === option.value && "border-primary bg-muted/30",
                  !option.available && "cursor-not-allowed opacity-60",
                )}
              >
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{option.help}</p>
                </div>
                {!option.available ? <StatusBadge tone="warning">Coming soon</StatusBadge> : null}
              </button>
            ))}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-3">
            {actionType === "send_text" ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                Send Text does not use template variable mapping. Continue to review.
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-medium">Map template variables to API parameters</h3>
                  <p className="text-sm text-muted-foreground">
                    Rename exposed parameters, mark required fields, and add descriptions for integrators.
                  </p>
                </div>
                <VariableMappingTable mappings={variableMappings} onChange={setVariableMappings} />
              </>
            )}
          </div>
        ) : null}

        {step === 6 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <ReviewRow label="Name" value={name} />
              <ReviewRow label="Slug" value={slug} />
              <ReviewRow label="Action" value={actionType === "send_text" ? "Send Text" : "Send Template"} />
              <ReviewRow label="Template" value={actionType === "send_text" ? "—" : templateName} />
              <ReviewRow label="Recipient" value="Phone Number" />
              <ReviewRow
                label="Endpoint URL"
                value="Assigned on create — POST /api/v1/automation/endpoints/{ept_…}"
              />
              <div>
                <p className="text-xs text-muted-foreground">Authentication</p>
                <p className="text-sm">Bearer workspace Automation API key</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Example request body</p>
              <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">
                {JSON.stringify(exampleBody, null, 2)}
              </pre>
              <p className="text-xs text-muted-foreground">
                After create, docs and code samples will use your immutable endpoint URL
                ({endpointInvokeUrl("ept_…")}).
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" disabled={step === 1} onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {step < 6 ? (
          <Button type="button" onClick={goNext}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" disabled={submitting} onClick={() => void handleCreate()}>
            {submitting ? "Creating…" : "Create Endpoint"}
          </Button>
        )}
      </div>

      <Toast />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
