"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampaignCard } from "@/features/broadcast/components/campaigns/campaign-card";
import { CampaignChannelCard } from "@/features/broadcast/components/campaigns/campaign-channel-card";
import { WhatsAppMessagePreview } from "@/features/broadcast/components/shared/whatsapp-message-preview";
import { templateQueryService } from "@/features/broadcast/services/template-query.service";
import type { Template } from "@/features/broadcast/types/template";
import { templatePreviewHeaderType } from "@/features/broadcast/utils/template-preview";
import { channelQueryService } from "@/features/channels/services/channel-query.service";
import type { Channel } from "@/features/channels/types/channel";
import { filterTemplatesForChannel } from "@/features/channels/utils/channel-consumer";
import { SegmentPicker } from "@/features/segments/components/segment-picker";
import { segmentService } from "@/features/segments/services/segment.service";
import type { Segment } from "@/features/segments/types/segment";
import { segmentAudienceSummary } from "@/features/segments/utils/segment-audience";
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
    selectedSegmentIds,
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
    setSelectedSegmentIds,
    setSendMode,
    setScheduleDate,
    setScheduleTime,
    setTimezone,
    reset,
  } = useCampaignWizardStore();

  const [segments, setSegments] = useState<Segment[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [channelsLoaded, setChannelsLoaded] = useState(false);

  useEffect(() => {
    segmentService.list().then(setSegments);
  }, []);

  useEffect(() => {
    channelQueryService
      .getConnectedChannels()
      .then(setChannels)
      .finally(() => setChannelsLoaded(true));
  }, []);

  useEffect(() => {
    if (!channelId) {
      setTemplates([]);
      return;
    }
    templateQueryService.getTemplates().then((all) => {
      setTemplates(filterTemplatesForChannel(all, channelId));
    });
  }, [channelId]);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const fullTemplate = selectedTemplate;
  const variableCount = fullTemplate?.variable_count ?? 0;

  useEffect(() => {
    if (!fullTemplate) return;
    const mapping: Record<string, string> = {};
    const samples: Record<string, string> = {};
    for (let i = 1; i <= fullTemplate.variable_count; i += 1) {
      const key = String(i);
      mapping[key] = i === 1 ? "name" : i === 2 ? "discount" : "expired_date";
      samples[key] = mapping[key] ? `{{${mapping[key]}}}` : `Sample ${i}`;
    }
    setVariableMapping(mapping);
    setSampleValues(samples);
  }, [templateId, fullTemplate?.variable_count, setVariableMapping, setSampleValues]);

  const previewBody = useMemo(() => {
    let body = fullTemplate?.body ?? "";
    Object.entries(sampleValues).forEach(([key, value]) => {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    });
    return body;
  }, [fullTemplate, sampleValues]);

  const estimatedRecipients = useMemo(() => {
    return segments
      .filter((s) => selectedSegmentIds.includes(s.id))
      .reduce((sum, s) => sum + s.contact_count, 0);
  }, [segments, selectedSegmentIds]);

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
      if (!templateId) return "Select a template";
      if (templates.length === 0) {
        return "No templates available for the selected channel. Sync templates first.";
      }
    }
    if (step === 5 && selectedSegmentIds.length === 0) return "Select at least one segment";
    if (step === 6 && sendMode === "later" && (!scheduleDate || !scheduleTime)) {
      return "Date and time are required for scheduled campaigns";
    }
    return null;
  }

  function handleNext() {
    setError(null);
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    if (step === 7) {
      notify("success", "Campaign created successfully");
      reset();
      router.push("/broadcast/campaigns");
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
                  className="min-h-[90px] w-full rounded-md border px-3 py-2 text-sm"
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
            <div className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold">Map Variables</h2>
              <p className="text-xs text-muted-foreground">
                Map template variables to contact fields and provide sample values.
              </p>
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
                              className="h-9 w-full rounded-md border px-2 text-sm"
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
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold">Select Audience</h2>
              <p className="text-xs text-muted-foreground">
                Campaign audience uses segments only. Individual contacts cannot be selected.
              </p>
              <SegmentPicker
                segments={segments}
                selectedIds={selectedSegmentIds}
                onChange={setSelectedSegmentIds}
              />
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
                      className="h-10 w-full rounded-md border px-3 text-sm"
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
                <SummaryItem label="Audience" value={segmentAudienceSummary(segments, selectedSegmentIds)} />
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
            <Button onClick={handleNext} disabled={step === 2 && channelsLoaded && channels.length === 0}>
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
              headerType={templatePreviewHeaderType(fullTemplate.header.type)}
              body={previewBody}
              footer={fullTemplate.footer}
              buttons={fullTemplate.buttons}
            />
          ) : null}
          {step >= 5 ? (
            <div className="mt-4 rounded-lg border bg-card p-4 text-sm">
              <p className="font-semibold">Audience Preview</p>
              <p className="mt-1 text-muted-foreground">{segmentAudienceSummary(segments, selectedSegmentIds)}</p>
              <p className="mt-2 text-xs text-muted-foreground">~{estimatedRecipients.toLocaleString()} recipients</p>
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
