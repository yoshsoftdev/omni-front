"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampaignCard } from "@/features/broadcast/components/campaigns/campaign-card";
import { CampaignChannelCard } from "@/features/broadcast/components/campaigns/campaign-channel-card";
import { WhatsAppMessagePreview } from "@/features/broadcast/components/shared/whatsapp-message-preview";
import { templateQueryService } from "@/features/broadcast/services/template-query.service";
import { countTemplateVariables, templatePreviewHeaderType } from "@/features/broadcast/utils/template-preview";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import type { Channel } from "@/features/channels/types/channel";
import { SegmentPicker } from "@/features/segments/components/segment-picker";
import { segmentService } from "@/features/segments/services/segment.service";
import type { Segment } from "@/features/segments/types/segment";
import {
  campaignAudienceSummary,
  campaignEstimatedRecipients,
  countSegmentRecipients,
  countTagRecipients,
} from "@/features/broadcast/utils/campaign-audience";
import { tagService } from "@/features/contacts/services/tag.service";
import type { ContactTag } from "@/types/contact";
import { campaignService } from "@/features/broadcast/services/broadcast.service";
import { useCampaignWizardStore, type WizardStep } from "@/store/campaign-wizard-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: "Campaign Information" },
  { step: 2, label: "Select Channel" },
  { step: 3, label: "Select Template" },
  { step: 4, label: "Map Variables" },
  { step: 5, label: "Select Audience" },
  { step: 6, label: "Schedule" },
  { step: 7, label: "Review" },
];

const formControlClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const FIELD_OPTIONS = [
  { value: "name", label: "Contact Name" },
  { value: "discount", label: "Discount" },
  { value: "expired_date", label: "Expiry Date" },
  { value: "order_number", label: "Order Number" },
  { value: "amount", label: "Amount" },
  { value: "delivery_date", label: "Delivery Date" },
];

function Stepper({ activeStep }: { activeStep: WizardStep }) {
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

export function CampaignWizard() {
  const router = useRouter();
  const { notify, Toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    step,
    campaignName,
    description,
    channelId,
    channelName,
    phoneNumber,
    templateId,
    variableMapping,
    sampleValues,
    headerMediaUrl,
    headerVariableMapping,
    includeHeader,
    includeFooter,
    selectedSegmentIds,
    selectedTagIds,
    sendMode,
    scheduleDate,
    scheduleTime,
    timezone,
    setStep,
    setCampaignName,
    setDescription,
    setChannel,
    setTemplateId,
    setVariableMapping,
    setSampleValues,
    setHeaderMediaUrl,
    setHeaderVariableMapping,
    setIncludeHeader,
    setIncludeFooter,
    setSelectedSegmentIds,
    setSelectedTagIds,
    setSendMode,
    setScheduleDate,
    setScheduleTime,
    setTimezone,
    reset,
  } = useCampaignWizardStore();

  const [segments, setSegments] = useState<Segment[]>([]);
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoaded, setChannelsLoaded] = useState(false);

  const {
    data: templates = [],
    isLoading: templatesLoading,
    isError: templatesError,
    error: templatesLoadError,
  } = useQuery({
    queryKey: ["broadcast-templates", "campaign-wizard", channelId],
    queryFn: () =>
      templateQueryService.getTemplates({
        channelId,
        status: "APPROVED",
      }),
    enabled: Boolean(channelId),
    retry: false,
  });

  useEffect(() => {
    segmentService.list().then(setSegments);
    tagService.list().then(setTags).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    channelQueryService
      .getConnectedChannels()
      .then(setChannels)
      .finally(() => setChannelsLoaded(true));
  }, []);

  useEffect(() => {
    if (!templatesError) return;
    const message =
      templatesLoadError instanceof Error
        ? templatesLoadError.message
        : "Failed to load templates";
    if (message.toLowerCase().includes("unauthorized")) {
      notify("error", "Session expired. Please sign in again.");
      router.replace("/login");
      return;
    }
    notify("error", message);
  }, [templatesError, templatesLoadError, notify, router]);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const fullTemplate = selectedTemplate;
  const variableCount = fullTemplate?.variable_count ?? 0;
  const headerType = fullTemplate?.header?.type ?? "none";
  const headerTextVariableCount = countTemplateVariables(fullTemplate?.header?.title);
  const hasMediaHeader = headerType === "image" || headerType === "video" || headerType === "document";
  const hasTemplateHeader = headerType !== "none";
  const hasTemplateFooter = Boolean(fullTemplate?.footer?.trim());

  useEffect(() => {
    if (!fullTemplate) return;
    const mapping: Record<string, string> = {};
    const samples: Record<string, string> = {};
    for (let i = 1; i <= fullTemplate.variable_count; i += 1) {
      const key = String(i);
      mapping[key] = i === 1 ? "name" : i === 2 ? "discount" : "expired_date";
      samples[key] = mapping[key] ? `{{${mapping[key]}}}` : `Sample ${i}`;
    }
    const headerMapping: Record<string, string> = {};
    for (let i = 1; i <= headerTextVariableCount; i += 1) {
      const key = String(i);
      headerMapping[key] = "name";
    }
    setVariableMapping(mapping);
    setSampleValues(samples);
    setHeaderVariableMapping(headerMapping);
    setIncludeHeader(hasTemplateHeader);
    setIncludeFooter(hasTemplateFooter);
  }, [
    templateId,
    fullTemplate?.variable_count,
    fullTemplate?.header?.title,
    headerTextVariableCount,
    hasTemplateHeader,
    hasTemplateFooter,
    setVariableMapping,
    setSampleValues,
    setHeaderVariableMapping,
    setIncludeHeader,
    setIncludeFooter,
  ]);

  const previewBody = useMemo(() => {
    let body = fullTemplate?.body ?? "";
    Object.entries(sampleValues).forEach(([key, value]) => {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    });
    return body;
  }, [fullTemplate, sampleValues]);

  const segmentRecipientCount = useMemo(
    () => countSegmentRecipients(segments, selectedSegmentIds),
    [segments, selectedSegmentIds],
  );
  const tagRecipientCount = useMemo(
    () => countTagRecipients(tags, selectedTagIds),
    [tags, selectedTagIds],
  );
  const estimatedRecipients = useMemo(
    () => campaignEstimatedRecipients(segments, selectedSegmentIds, tags, selectedTagIds),
    [segments, selectedSegmentIds, tags, selectedTagIds],
  );
  const audienceSummary = useMemo(
    () => campaignAudienceSummary(segments, selectedSegmentIds, tags, selectedTagIds),
    [segments, selectedSegmentIds, tags, selectedTagIds],
  );

  function validateCurrentStep(): string | null {
    if (step === 1 && !campaignName.trim()) return "Campaign name is required";
    if (step === 2) {
      if (!channelsLoaded) return "Loading channels...";
      if (channels.length === 0) {
        return "No connected channels. Connect a WhatsApp channel before creating a campaign.";
      }
      if (!channelId) return "Select a channel";
    }
    if (step === 3) {
      if (!channelId) return "Select a channel before choosing a template";
      if (templatesLoading) return "Loading templates...";
      if (templatesError) return "Could not load templates. Try again or sign in again.";
      if (!templateId) return "Select a template";
      if (templates.length === 0) {
        return "No templates available for the selected channel. Sync templates first.";
      }
    }
    if (step === 4) {
      if (!fullTemplate) return "Select a template first";
      if (hasMediaHeader && includeHeader && !headerMediaUrl.trim()) {
        return "Header media URL is required for image/video/document templates";
      }
      if (hasMediaHeader && includeHeader && !/^https?:\/\//i.test(headerMediaUrl.trim())) {
        return "Header media URL must start with http:// or https://";
      }
    }
    if (step === 5 && selectedSegmentIds.length === 0 && selectedTagIds.length === 0) {
      return "Select at least one segment or tag";
    }
    if (step === 6 && sendMode === "later" && (!scheduleDate || !scheduleTime)) {
      return "Date and time are required for scheduled campaigns";
    }
    return null;
  }

  async function handleNext() {
    setError(null);
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    if (step === 7) {
      if (!channelId || !templateId) {
        setError("Channel and template are required");
        return;
      }
      try {
        setIsSubmitting(true);
        const scheduledAt =
          sendMode === "later" && scheduleDate && scheduleTime
            ? new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString()
            : undefined;
        const variableMappingPayload: NonNullable<Parameters<typeof campaignService.create>[0]["variable_mapping"]> = {
          body: variableMapping,
        };
        if (hasTemplateHeader && includeHeader) {
          variableMappingPayload.header = {
            ...(headerMediaUrl.trim() ? { media_link: headerMediaUrl.trim() } : {}),
            ...(headerTextVariableCount > 0 ? { text: headerVariableMapping } : {}),
          };
        }
        await campaignService.create({
          name: campaignName.trim(),
          description: description.trim() || undefined,
          device_id: channelId,
          template_id: templateId,
          variable_mapping: variableMappingPayload,
          sample_values: sampleValues,
          timezone: sendMode === "later" ? timezone : undefined,
          segment_ids: selectedSegmentIds,
          tag_ids: selectedTagIds,
          scheduled_at: scheduledAt,
        });
        notify("success", "Campaign created successfully");
        reset();
        router.push("/broadcast/campaigns");
      } catch (createErr) {
        setError(createErr instanceof Error ? createErr.message : "Failed to create campaign");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    setStep((step + 1) as WizardStep);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Campaign"
        description="Set up a new broadcast campaign using a connected channel, approved template, and segment audience."
        right={
          <Button variant="outline" size="sm" asChild>
            <Link href="/broadcast/campaigns">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Link>
          </Button>
        }
      />

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
          {error.includes("No connected channels") ? (
            <div className="mt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/devices">Connect WhatsApp Channel</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-6">
          <Stepper activeStep={step} />

          {step === 1 ? (
            <div className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold">Campaign Information</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Campaign Name</Label>
                  <span className="text-xs text-muted-foreground">{campaignName.length}/100</span>
                </div>
                <Input
                  value={campaignName}
                  maxLength={100}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Promo Juni Diskon 20%"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Description</Label>
                  <span className="text-xs text-muted-foreground">{description.length}/200</span>
                </div>
                <textarea
                  value={description}
                  maxLength={200}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(formControlClass, "min-h-[90px] resize-y")}
                  placeholder="Optional description"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Select Channel</h2>
              <p className="text-xs text-muted-foreground">
                Choose the WhatsApp channel that will send this campaign.
              </p>
              {!channelsLoaded ? (
                <p className="text-sm text-muted-foreground">Loading connected channels...</p>
              ) : channels.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <p>No connected channels found.</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/devices">Connect WhatsApp Channel</Link>
                  </Button>
                </div>
              ) : (
                channels.map((channel) => (
                  <CampaignChannelCard
                    key={channel.id}
                    channel={channel}
                    selected={channelId === channel.id}
                    onSelect={() => setChannel(channel)}
                  />
                ))
              )}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Select Template</h2>
              {!channelId ? (
                <p className="text-sm text-muted-foreground">Select a channel first to view available templates.</p>
              ) : templatesLoading ? (
                <p className="text-sm text-muted-foreground">Loading templates...</p>
              ) : templatesError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
                  <p>Could not load templates. Your session may have expired.</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/login">Sign in again</Link>
                  </Button>
                </div>
              ) : templates.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <p>No templates synced for {channelName || "this channel"}.</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/broadcast/templates">Sync Templates</Link>
                  </Button>
                </div>
              ) : (
                templates.map((template) => (
                  <CampaignCard
                    key={template.id}
                    template={template}
                    selected={templateId === template.id}
                    onSelect={() => setTemplateId(template.id)}
                  />
                ))
              )}
            </div>
          ) : null}

          {step === 4 && fullTemplate ? (
            <div className="space-y-4">
              {(hasTemplateHeader || hasTemplateFooter) ? (
                <div className="space-y-4 rounded-lg border bg-card p-5">
                  <div>
                    <h2 className="text-sm font-semibold">Template Components</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Configure header media and choose which parts appear in the preview.
                    </p>
                  </div>

                  {hasTemplateHeader ? (
                    <div className="space-y-3 rounded-md border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium capitalize">Header ({headerType})</p>
                          {fullTemplate.header.title ? (
                            <p className="text-xs text-muted-foreground">{fullTemplate.header.title}</p>
                          ) : null}
                        </div>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={includeHeader}
                            onChange={(event) => setIncludeHeader(event.target.checked)}
                          />
                          Show in preview
                        </label>
                      </div>

                      {includeHeader && hasMediaHeader ? (
                        <div className="space-y-2">
                          <Label htmlFor="header-media-url">
                            {headerType === "image" ? "Image" : headerType === "video" ? "Video" : "Document"} URL
                          </Label>
                          <Input
                            id="header-media-url"
                            value={headerMediaUrl}
                            onChange={(event) => setHeaderMediaUrl(event.target.value)}
                            placeholder="https://example.com/banner.jpg"
                          />
                          <p className="text-xs text-muted-foreground">
                            Public HTTPS URL required by Meta when sending templates with media headers.
                          </p>
                        </div>
                      ) : null}

                      {includeHeader && headerTextVariableCount > 0 ? (
                        <div className="overflow-hidden rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs">Header Variable</th>
                                <th className="px-3 py-2 text-left text-xs">Map To</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: headerTextVariableCount }, (_, i) => i + 1).map((n) => {
                                const key = String(n);
                                return (
                                  <tr key={`header-${key}`} className="border-t">
                                    <td className="px-3 py-3 font-medium">{`{{${key}}}`}</td>
                                    <td className="px-3 py-3">
                                      <select
                                        className={cn(formControlClass, "h-9")}
                                        value={headerVariableMapping[key] ?? "name"}
                                        onChange={(event) =>
                                          setHeaderVariableMapping({
                                            ...headerVariableMapping,
                                            [key]: event.target.value,
                                          })
                                        }
                                      >
                                        {FIELD_OPTIONS.map((opt) => (
                                          <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {hasTemplateFooter ? (
                    <div className="space-y-3 rounded-md border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Footer</p>
                          <p className="text-xs text-muted-foreground">{fullTemplate.footer}</p>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={includeFooter}
                            onChange={(event) => setIncludeFooter(event.target.checked)}
                          />
                          Show in preview
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-4 rounded-lg border bg-card p-5">
                <h2 className="text-sm font-semibold">Map Body Variables</h2>
                <p className="text-xs text-muted-foreground">
                  Map template body variables to contact fields and provide sample values.
                </p>
                {variableCount === 0 ? (
                  <p className="text-sm text-muted-foreground">This template has no body variables.</p>
                ) : (
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs">Variable</th>
                          <th className="px-3 py-2 text-left text-xs">Map To</th>
                          <th className="px-3 py-2 text-left text-xs">Sample Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: variableCount }, (_, i) => i + 1).map((n) => {
                          const key = String(n);
                          return (
                            <tr key={key} className="border-t">
                              <td className="px-3 py-3 font-medium">{`{{${key}}}`}</td>
                              <td className="px-3 py-3">
                                <select
                                  className={cn(formControlClass, "h-9")}
                                  value={variableMapping[key] ?? "name"}
                                  onChange={(e) =>
                                    setVariableMapping({ ...variableMapping, [key]: e.target.value })
                                  }
                                >
                                  {FIELD_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-3">
                                <Input
                                  value={sampleValues[key] ?? ""}
                                  onChange={(e) => setSampleValues({ ...sampleValues, [key]: e.target.value })}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold">Select Audience</h2>
              <p className="text-xs text-muted-foreground">
                You can combine segments and tags. Duplicate contacts are automatically deduplicated on send.
              </p>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <p className="font-medium">Estimated recipients: ~{estimatedRecipients.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Segments: {segmentRecipientCount.toLocaleString()} contacts
                  {selectedTagIds.length > 0 ? ` · Tags: ${tagRecipientCount.toLocaleString()} contacts` : ""}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Segments</p>
                <SegmentPicker
                  segments={segments}
                  selectedIds={selectedSegmentIds}
                  onChange={setSelectedSegmentIds}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</p>
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags available.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setSelectedTagIds([...selectedTagIds, tag.id]);
                            } else {
                              setSelectedTagIds(selectedTagIds.filter((id) => id !== tag.id));
                            }
                          }}
                        />
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary/70" />
                        <span className="font-medium">{tag.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{tag.contact_count}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold">Schedule</h2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={sendMode === "now"} onChange={() => setSendMode("now")} /> Send Now
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={sendMode === "later"} onChange={() => setSendMode("later")} /> Schedule
                  Later
                </label>
              </div>
              {sendMode === "later" ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <select
                      className={cn(formControlClass, "h-10")}
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                      <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                      <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 7 ? (
            <div className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold">Review</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <SummaryItem label="Campaign Name" value={campaignName} />
                <SummaryItem label="Channel" value={channelName || "—"} />
                <SummaryItem label="Phone Number" value={phoneNumber || "—"} />
                <SummaryItem label="Template" value={selectedTemplate?.name ?? "—"} />
                <SummaryItem label="Audience" value={audienceSummary} />
                <SummaryItem label="Estimated Recipients" value={estimatedRecipients.toLocaleString()} />
                <SummaryItem
                  label="Schedule"
                  value={sendMode === "now" ? "Send immediately" : `${scheduleDate} ${scheduleTime} (${timezone})`}
                />
              </dl>
            </div>
          ) : null}

          <div className="flex justify-between">
            <Button variant="outline" disabled={step === 1} onClick={() => setStep((step - 1) as WizardStep)}>
              Back
            </Button>
            <Button
              onClick={() => void handleNext()}
              disabled={(step === 2 && channelsLoaded && channels.length === 0) || isSubmitting}
            >
              {step === 7 ? "Create Campaign" : "Next"} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="hidden w-[360px] shrink-0 lg:block">
          {fullTemplate ? (
            <WhatsAppMessagePreview
              heading="Template Preview"
              deviceName={channelName || "Omni-Chan Official"}
              languageLabel={selectedTemplate?.language_label ?? "Indonesia (ID)"}
              headerType={
                includeHeader ? templatePreviewHeaderType(fullTemplate.header?.type ?? "none") : undefined
              }
              body={previewBody}
              footer={includeFooter ? fullTemplate.footer : undefined}
              buttons={fullTemplate.buttons}
            />
          ) : null}
          {step >= 5 ? (
            <div className="mt-4 rounded-lg border bg-card p-4 text-sm">
              <p className="font-semibold">Audience Preview</p>
              <p className="mt-1 text-muted-foreground">{audienceSummary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Segments: {segmentRecipientCount.toLocaleString()} · Tags: {tagRecipientCount.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">~{estimatedRecipients.toLocaleString()} recipients total</p>
            </div>
          ) : null}
        </div>
      </div>

      <Toast />
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
