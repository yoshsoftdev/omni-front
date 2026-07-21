"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { PageTabs } from "@/components/shared/page-tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/broadcast/components/campaigns/campaign-table";
import { useCampaignSendGuard } from "@/features/broadcast/hooks/use-campaign-send-guard";
import { WhatsAppMessagePreview } from "@/features/broadcast/components/shared/whatsapp-message-preview";
import { campaignQueryService } from "@/features/broadcast/services/campaign-query.service";
import { templateQueryService } from "@/features/broadcast/services/template-query.service";
import type { Campaign } from "@/features/broadcast/types/campaign";
import type { Template } from "@/features/broadcast/types/template";
import { calcPct } from "@/features/broadcast/utils/campaign-metrics";
import { templatePreviewHeaderType } from "@/features/broadcast/utils/template-preview";
import { useToast } from "@/hooks/use-toast";
import { formatApiErrorMessage } from "@/services/api/errors";

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCount(value?: number) {
  return (value ?? 0).toLocaleString();
}

export function CampaignDetailPage({ campaignId }: { campaignId: string }) {
  const { notify, Toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [template, setTemplate] = useState<Template | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const { sendCampaign, paymentDialog } = useCampaignSendGuard(campaign?.device_id);

  useEffect(() => {
    setLoaded(false);
    campaignQueryService.getCampaignById(campaignId).then((result) => {
      setCampaign(result);
      setLoaded(true);
    });
  }, [campaignId]);

  useEffect(() => {
    if (!campaign) {
      setTemplate(undefined);
      return;
    }
    templateQueryService
      .getTemplateById(campaign.template_id)
      .then((result) => result ?? templateQueryService.getTemplateByName(campaign.template_name))
      .then(setTemplate);
  }, [campaign]);

  if (!loaded) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        Loading campaign...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/broadcast/campaigns"><ArrowLeft className="h-4 w-4" /> Back to Campaigns</Link>
        </Button>
        <div className="rounded-lg border bg-card p-8 text-sm text-destructive">Campaign not found.</div>
      </div>
    );
  }

  let previewBody = template?.body ?? "Preview not available";
  Object.entries(campaign.sample_values ?? {}).forEach(([key, value]) => {
    previewBody = previewBody.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/broadcast/campaigns"><ArrowLeft className="h-4 w-4" /> Back to Campaigns</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-muted-foreground">Created by {campaign.created_by}</p>
        </div>
        <div className="flex gap-2">
          {campaign.status === "draft" || campaign.status === "scheduled" ? (
            <Button
              size="sm"
              disabled={sending}
              onClick={() => {
                setSending(true);
                void sendCampaign(campaign.id, campaign.device_id)
                  .then((updated) => {
                    setCampaign(updated);
                    notify("success", "Campaign queued for send");
                  })
                  .catch((err) => {
                    if (formatApiErrorMessage(err) !== "Marketing campaigns require a Meta payment method.") {
                      notify("error", formatApiErrorMessage(err));
                    }
                  })
                  .finally(() => setSending(false));
              }}
            >
              {sending ? "Sending..." : "Send Campaign"}
            </Button>
          ) : null}
          <Button variant="outline" size="sm">Edit Campaign</Button>
        </div>
      </div>

      <PageTabs
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "audience", label: "Audience" },
          { value: "messages", label: "Messages" },
          { value: "activity", label: "Activity" },
          { value: "reports", label: "Reports" },
        ]}
        value="overview"
        onChange={() => {}}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Campaign Information</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <InfoRow label="Campaign Name" value={campaign.name} />
              <InfoRow label="Template" value={campaign.template_name} />
              <InfoRow label="Audience" value={campaign.audience?.name || campaign.segment_name || "—"} />
              <InfoRow label="Schedule" value={formatDateTime(campaign.scheduled_at)} />
              <InfoRow label="Created By" value={campaign.created_by ?? "—"} />
              <InfoRow label="Created At" value={formatDateTime(campaign.created_at)} />
            </dl>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Audience Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <InfoRow
                label="Audience"
                value={campaign.audience?.name || campaign.segment_name || "—"}
              />
              <InfoRow
                label="Estimated Recipients"
                value={formatCount(campaign.audience?.recipient_count ?? campaign.total_contacts)}
              />
            </dl>
          </section>
        </div>

        <div className="lg:col-span-1">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">Message Preview</h2>
            <WhatsAppMessagePreview
              heading="WhatsApp Preview"
              deviceName="Omni-Chan Official"
              languageLabel={campaign.template_language}
              headerType={template ? templatePreviewHeaderType(template.header.type) : undefined}
              body={previewBody}
              footer={template?.footer}
              buttons={template?.buttons}
            />
          </section>
        </div>

        <div className="lg:col-span-1">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Delivery Summary</h2>
            <div className="mt-4 grid gap-3">
              <MetricCard label="Sent" value={campaign.sent_count ?? 0} total={campaign.sent_count ?? 0} />
              <MetricCard label="Delivered" value={campaign.delivered_count ?? 0} total={campaign.sent_count ?? 0} />
              <MetricCard label="Read" value={campaign.read_count ?? 0} total={campaign.sent_count ?? 0} />
              <MetricCard label="Failed" value={campaign.failed_count ?? 0} total={campaign.sent_count ?? 0} />
              <MetricCard label="Replies" value={campaign.reply_count ?? 0} total={campaign.sent_count ?? 0} />
            </div>
          </section>
        </div>
      </div>
      {paymentDialog}
      <Toast />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function MetricCard({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value.toLocaleString()}</p>
      <p className="text-[10px] text-muted-foreground">{calcPct(value, total)}</p>
    </div>
  );
}
