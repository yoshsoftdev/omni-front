"use client";

import { WhatsAppMessagePreview } from "@/features/broadcast/components/shared/whatsapp-message-preview";
import type { Template } from "@/features/broadcast/types/template";
import { templatePreviewHeaderType } from "@/features/broadcast/utils/template-preview";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
};

interface CampaignCardProps {
  template: Template;
  selected: boolean;
  onSelect: () => void;
  showPreview?: boolean;
}

export function CampaignCard({ template, selected, onSelect, showPreview = false }: CampaignCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white transition-colors dark:bg-card",
        selected ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/40",
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 p-4 text-left">
        <input type="radio" readOnly checked={selected} className="mt-1" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{template.name}</span>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", STATUS_STYLES[template.status])}>
              {template.status}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {template.category} · {template.language_label}
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{template.preview}</p>
        </div>
      </button>
      {showPreview ? (
        <div className="border-t p-4">
          <WhatsAppMessagePreview
            heading="Preview"
            deviceName="Omni-Chan Official"
            languageLabel={template.language_label}
            headerType={templatePreviewHeaderType(template.header.type)}
            body={template.body}
            footer={template.footer}
            buttons={template.buttons}
          />
        </div>
      ) : null}
    </div>
  );
}
