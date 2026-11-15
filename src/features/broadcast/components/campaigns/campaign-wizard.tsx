"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/empty-state";
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar";
import { PaginationFooter } from "@/components/shared/pagination-footer";
import { StepWizard } from "@/components/shared/step-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampaignCard } from "@/features/broadcast/components/campaigns/campaign-card";
import { CampaignChannelCard } from "@/features/broadcast/components/campaigns/campaign-channel-card";
import { CampaignHeaderMedia } from "@/features/broadcast/components/campaigns/campaign-header-media";
import { WhatsAppMessagePreview } from "@/features/broadcast/components/shared/whatsapp-message-preview";
import { templateQueryService } from "@/features/broadcast/services/template-query.service";
import type { Template } from "@/features/broadcast/types/template";
import { headerMediaError } from "@/features/broadcast/utils/header-media";
import { countTemplateVariables, templatePreviewHeaderType } from "@/features/broadcast/utils/template-preview";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import type { Channel } from "@/features/channels/types/channel";
import { isWhatsAppChannel } from "@/features/channels/utils/is-whatsapp-channel";
import {
  campaignAudienceSummary,
  campaignEstimatedRecipients,
  countTagRecipients,
} from "@/features/broadcast/utils/campaign-audience";
import { tagService } from "@/features/contacts/services/tag.service";
import type { ContactTag } from "@/types/contact";
import { campaignService } from "@/features/broadcast/services/broadcast.service";
import { useCampaignWizardStore, type WizardStep } from "@/store/campaign-wizard-store";
import { useToast } from "@/hooks/use-toast";
import { formatApiErrorMessage } from "@/services/api/errors";
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

const TEMPLATE_PAGE_SIZE = 8;

const templateLanguageOptions = [
  { value: "all", label: "Semua Bahasa" },
  { value: "id", label: "Indonesia" },
  { value: "en", label: "English" },
];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB)" },
  { value: "Asia/Makassar", label: "Asia/Makassar (WITA)" },
  { value: "Asia/Jayapura", label: "Asia/Jayapura (WIT)" },
];

const formControlClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const FIELD_OPTIONS = [
  { value: "contact_name", label: "Contact Name" },
  { value: "customer_name", label: "Customer Name" },
  { value: "discount", label: "Discount" },
  { value: "expired_date", label: "Expiry Date" },
  { value: "order_number", label: "Order Number" },
  { value: "amount", label: "Amount" },
  { value: "delivery_date", label: "Delivery Date" },
];

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
    headerVariableMapping,
    includeHeader,
    includeFooter,
    selectedTagIds,
    sendMode,
    scheduleDate,
    scheduleTime,
    timezone,
    headerMediaUrl,
    headerMediaFile,
    setStep,
    setCampaignName,
    setDescription,
    setChannel,
    setTemplateId,
    setVariableMapping,
    setSampleValues,
    setHeaderVariableMapping,
    setHeaderMediaUrl,
    setHeaderMediaFile,
    setIncludeHeader,
    setIncludeFooter,
    setSelectedTagIds,
    setSendMode,
    setScheduleDate,
    setScheduleTime,
    setTimezone,
    reset,
  } = useCampaignWizardStore();

  const [tags, setTags] = useState<ContactTag[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoaded, setChannelsLoaded] = useState(false);
  const [templateSearchInput, setTemplateSearchInput] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("all");
  const [templatePage, setTemplatePage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTemplateSearch(templateSearchInput);
      setTemplatePage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [templateSearchInput]);

  const templateQueryParams = useMemo(
    () => ({
      channelId,
      status: "APPROVED" as const,
      search: templateSearch.trim() || undefined,
      language: templateLanguage,
      page: templatePage,
      pageSize: TEMPLATE_PAGE_SIZE,
    }),
    [channelId, templateSearch, templateLanguage, templatePage],
  );

  const {
    data: templatesPage,
    isLoading: templatesLoading,
    isError: templatesError,
    error: templatesLoadError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ["broadcast-templates", "campaign-wizard", templateQueryParams],
    queryFn: () => templateQueryService.getTemplatesPage(templateQueryParams),
    enabled: Boolean(channelId),
    retry: false,
  });

  const templates = templatesPage?.items ?? [];
  const templateTotal = templatesPage?.pagination.total ?? 0;
  const templateTotalPages = Math.max(1, templatesPage?.pagination.total_pages ?? 1);
  const templateCurrentPage = Math.min(templatePage, templateTotalPages);
  const templateStart = templateTotal === 0 ? 0 : (templateCurrentPage - 1) * TEMPLATE_PAGE_SIZE + 1;
  const templateEnd = Math.min(templateCurrentPage * TEMPLATE_PAGE_SIZE, templateTotal);

  const { data: selectedTemplateById } = useQuery({
    queryKey: ["broadcast-template", templateId],
    queryFn: () => templateQueryService.getTemplateById(templateId!),
    enabled: Boolean(templateId) && !templates.some((t) => t.id === templateId),
    retry: false,
  });

  useEffect(() => {
    setTemplateSearchInput("");
    setTemplateSearch("");
    setTemplateLanguage("all");
    setTemplatePage(1);
  }, [channelId]);

  useEffect(() => {
    tagService.list().then(setTags).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    channelQueryService
      .getConnectedChannels()
      .then((list) => setChannels(list.filter(isWhatsAppChannel)))
      .finally(() => setChannelsLoaded(true));
  }, []);

  useEffect(() => {
    if (!templatesError) return;
    const message =
      templatesLoadError instanceof Error
        ? templatesLoadError.message
        : "Failed to load templates";
    // Other failures are shown inline with a retry; only an expired session leaves the wizard.
    if (message.toLowerCase().includes("unauthorized")) {
      notify("error", "Session expired. Please sign in again.");
      router.replace("/login");
    }
  }, [templatesError, templatesLoadError, notify, router]);

  const selectedTemplate =
    templates.find((t) => t.id === templateId) ?? selectedTemplateById ?? undefined;
  const fullTemplate = selectedTemplate;
  const variableCount = fullTemplate?.variable_count ?? 0;
  const headerType = fullTemplate?.header?.type ?? "none";
  const headerTextVariableCount = countTemplateVariables(fullTemplate?.header?.title);
  const hasMediaHeader = headerType === "image" || headerType === "video" || headerType === "document";
  const hasStoredHeaderMedia = Boolean(fullTemplate?.header.storage_backed);
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

  const tagRecipientCount = useMemo(
    () => countTagRecipients(tags, selectedTagIds),
    [tags, selectedTagIds],
  );
  const estimatedRecipients = useMemo(
    () => campaignEstimatedRecipients(tags, selectedTagIds),
    [tags, selectedTagIds],
  );
  const audienceSummary = useMemo(
    () => campaignAudienceSummary(tags, selectedTagIds),
    [tags, selectedTagIds],
  );

  function validateCurrentStep(): string | null {
    if (step === 1 && !campaignName.trim()) return "Campaign name is required";
    if (step === 2) {
      if (!channelsLoaded) return "Loading channels...";
      if (channels.length === 0) {
        return "No connected WhatsApp channels. Connect a WhatsApp channel before creating a campaign.";
      }
      if (!channelId) return "Select a channel";
    }
    if (step === 3) {
      if (!channelId) return "Select a channel before choosing a template";
      if (templatesLoading) return "Loading templates...";
      if (templatesError) return "Could not load templates. Try again.";
      if (!templateId) return "Select a template";
      if (templates.length === 0) {
        return "No templates available for the selected channel. Sync templates first.";
      }
    }
    if (step === 4) {
      if (!fullTemplate) return "Select a template first";
      // The header is part of the approved template, so it is always sent ("Show in preview" is preview-only).
      if (hasMediaHeader) {
        const mediaError = headerMediaError({
          storedOnTemplate: hasStoredHeaderMedia,
          fileObjectId: headerMediaFile?.objectId,
          url: headerMediaFile ? "" : headerMediaUrl,
        });
        if (mediaError) return mediaError;
      }
    }
    if (step === 5 && selectedTagIds.length === 0) {
      return "Select at least one tag";
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
        if (hasTemplateHeader) {
          variableMappingPayload.header = {
            ...(headerTextVariableCount > 0 ? { text: headerVariableMapping } : {}),
            ...(hasMediaHeader && headerMediaFile
              ? { storage_object_id: headerMediaFile.objectId }
              : hasMediaHeader && headerMediaUrl.trim()
                ? { media_link: headerMediaUrl.trim() }
                : {}),
          };
        }
        const created = await campaignService.create({
          name: campaignName.trim(),
          description: description.trim() || undefined,
          device_id: channelId,
          template_id: templateId,
          variable_mapping: variableMappingPayload,
          sample_values: sampleValues,
          timezone: sendMode === "later" ? timezone : undefined,
          tag_ids: selectedTagIds,
          scheduled_at: scheduledAt,
        });
        if (sendMode === "now") {
          try {
            await campaignService.send(created.id);
            notify("success", "Campaign created and queued for send");
          } catch (sendErr) {
            notify("error", formatApiErrorMessage(sendErr));
            reset();
            router.push(`/broadcast/campaigns/${created.id}`);
            return;
          }
        } else {
          notify("success", "Campaign scheduled successfully");
        }
        reset();
        router.push("/broadcast/campaigns");
      } catch (createErr) {
        setError(formatApiErrorMessage(createErr));
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
        description="Set up a new WhatsApp broadcast campaign using an approved Meta template and tag audience."
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
          {error.includes("No connected WhatsApp channels") || error.includes("No connected channels") ? (
            <div className="mt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/devices">Connect WhatsApp Channel</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <StepWizard steps={STEPS.map((s) => ({ id: s.step, label: s.label }))} currentStep={step} />

          {step === 1 ? (
            <div className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold">Campaign Information</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <span className="text-xs text-muted-foreground">{campaignName.length}/100</span>
                </div>
                <Input
                  id="campaign-name"
                  value={campaignName}
                  maxLength={100}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Promo Juni Diskon 20%"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="campaign-description">Description</Label>
                  <span className="text-xs text-muted-foreground">{description.length}/200</span>
                </div>
                <textarea
                  id="campaign-description"
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
                  <p>No connected WhatsApp channels found.</p>
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
              ) : (
                <>
                  <div className="space-y-3 rounded-lg border bg-card p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="relative w-full lg:max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Cari template..."
                          aria-label="Search templates"
                          value={templateSearchInput}
                          onChange={(e) => setTemplateSearchInput(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <FilterBar>
                        <FilterSelect
                          label="Bahasa"
                          value={templateLanguage}
                          onChange={(v) => {
                            setTemplateLanguage(v);
                            setTemplatePage(1);
                          }}
                          options={templateLanguageOptions}
                          className="bg-white dark:bg-card"
                        />
                      </FilterBar>
                    </div>
                  </div>

                  {templatesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading templates...</p>
                  ) : templatesError ? (
                    <ErrorState
                      message={formatApiErrorMessage(templatesLoadError) || "Could not load templates."}
                      onRetry={() => void refetchTemplates()}
                      className="p-6"
                    />
                  ) : templates.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      <p>
                        {templateSearch.trim() || templateLanguage !== "all"
                          ? "Tidak ada template yang cocok dengan pencarian."
                          : `No templates synced for ${channelName || "this channel"}.`}
                      </p>
                      {!templateSearch.trim() && templateLanguage === "all" ? (
                        <Button variant="outline" size="sm" className="mt-3" asChild>
                          <Link href="/broadcast/templates">Sync Templates</Link>
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {templates.map((template: Template) => (
                        <CampaignCard
                          key={template.id}
                          template={template}
                          selected={templateId === template.id}
                          onSelect={() => setTemplateId(template.id)}
                        />
                      ))}
                      <PaginationFooter
                        start={templateStart}
                        end={templateEnd}
                        total={templateTotal}
                        totalLabel="templates"
                        currentPage={templateCurrentPage}
                        totalPages={templateTotalPages}
                        onPageChange={setTemplatePage}
                      />
                    </div>
                  )}
                </>
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
                      {hasMediaHeader && hasStoredHeaderMedia
                        ? "Header media sudah tersimpan dari upload template. Atur variabel body di bawah jika ada."
                        : hasMediaHeader
                          ? "Template ini belum punya media tersimpan — isi URL gambar publik. Atur variabel body di bawah jika ada."
                          : "Atur variabel body di bawah jika ada."}
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

                      {hasMediaHeader ? (
                        <CampaignHeaderMedia
                          mediaType={headerType as "image" | "video" | "document"}
                          storedOnTemplate={hasStoredHeaderMedia}
                          file={headerMediaFile}
                          url={headerMediaUrl}
                          onFileChange={setHeaderMediaFile}
                          onUrlChange={setHeaderMediaUrl}
                        />
                      ) : null}

                      {headerTextVariableCount > 0 ? (
                        <DataTable>
                          <DataTableHead>
                            <DataTableRow>
                              <DataTableHeaderCell>Header Variable</DataTableHeaderCell>
                              <DataTableHeaderCell>Map To</DataTableHeaderCell>
                            </DataTableRow>
                          </DataTableHead>
                          <DataTableBody>
                            {Array.from({ length: headerTextVariableCount }, (_, i) => String(i + 1)).map((key) => (
                              <DataTableRow key={`header-${key}`}>
                                <DataTableCell className="font-medium">{`{{${key}}}`}</DataTableCell>
                                <DataTableCell>
                                  <FilterSelect
                                    label={`Header variable ${key} field`}
                                    value={headerVariableMapping[key] ?? "name"}
                                    onChange={(value) =>
                                      setHeaderVariableMapping({ ...headerVariableMapping, [key]: value })
                                    }
                                    options={FIELD_OPTIONS}
                                    className="h-9 w-full"
                                  />
                                </DataTableCell>
                              </DataTableRow>
                            ))}
                          </DataTableBody>
                        </DataTable>
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
                  <DataTable>
                    <DataTableHead>
                      <DataTableRow>
                        <DataTableHeaderCell>Variable</DataTableHeaderCell>
                        <DataTableHeaderCell>Map To</DataTableHeaderCell>
                        <DataTableHeaderCell>Sample Value</DataTableHeaderCell>
                      </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                      {Array.from({ length: variableCount }, (_, i) => String(i + 1)).map((key) => (
                        <DataTableRow key={key}>
                          <DataTableCell className="font-medium">{`{{${key}}}`}</DataTableCell>
                          <DataTableCell>
                            <FilterSelect
                              label={`Body variable ${key} field`}
                              value={variableMapping[key] ?? "name"}
                              onChange={(value) => setVariableMapping({ ...variableMapping, [key]: value })}
                              options={FIELD_OPTIONS}
                              className="h-9 w-full"
                            />
                          </DataTableCell>
                          <DataTableCell>
                            <Input
                              aria-label={`Body variable ${key} sample`}
                              value={sampleValues[key] ?? ""}
                              onChange={(e) => setSampleValues({ ...sampleValues, [key]: e.target.value })}
                            />
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTable>
                )}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold">Select Audience</h2>
              <p className="text-xs text-muted-foreground">
                Pilih tag kontak WhatsApp. Kontak Instagram-only tidak akan dikirim. Duplikat otomatis
                di-deduplicate saat send.
              </p>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <p className="font-medium">Estimated recipients: ~{estimatedRecipients.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tags: {tagRecipientCount.toLocaleString()} contacts
                </p>
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
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input id="schedule-date" type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input id="schedule-time" type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <FilterSelect
                      label="Timezone"
                      value={timezone}
                      onChange={setTimezone}
                      options={TIMEZONE_OPTIONS}
                      className="w-full"
                    />
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
                {hasMediaHeader ? (
                  <SummaryItem
                    label="Header media"
                    value={
                      headerMediaFile
                        ? `Uploaded: ${headerMediaFile.fileName}`
                        : headerMediaUrl.trim()
                          ? headerMediaUrl.trim()
                          : "Stored on template"
                    }
                  />
                ) : null}
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
              {step === 7 ? (sendMode === "now" ? "Create & Send" : "Create Campaign") : "Next"}{" "}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-[360px]">
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
                Tags: {tagRecipientCount.toLocaleString()} contacts
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
      <dd className="mt-1 break-all font-medium">{value}</dd>
    </div>
  );
}
