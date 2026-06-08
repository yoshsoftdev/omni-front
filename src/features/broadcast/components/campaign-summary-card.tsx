"use client";

export function CampaignSummaryCard({
  deviceName,
  templateName,
  language,
  variableCount,
  audienceText,
  scheduleText,
}: {
  deviceName: string;
  templateName: string;
  language: string;
  variableCount: number;
  audienceText: string;
  scheduleText: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm font-semibold">Ringkasan Campaign</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-muted-foreground">WABA / Device</div>
          <div className="text-right font-medium">{deviceName}</div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-muted-foreground">Template</div>
          <div className="text-right font-medium">{templateName}</div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-muted-foreground">Bahasa</div>
          <div className="text-right font-medium">{language}</div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-muted-foreground">Variable</div>
          <div className="text-right font-medium">{variableCount} variabel dipetakan</div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-muted-foreground">Audiences</div>
          <div className="text-right font-medium">{audienceText}</div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-muted-foreground">Jadwal</div>
          <div className="text-right font-medium">{scheduleText}</div>
        </div>
      </div>
    </div>
  );
}
