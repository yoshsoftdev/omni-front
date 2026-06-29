"use client";

import { SourceIcon, sourceLabel } from "@/components/shared/source-icon";
import type { Contact } from "@/types/contact";

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContactMetadataPanel({ contact }: { contact: Contact }) {
  return (
    <section className="rounded-lg border bg-muted/20 p-4">
      <h4 className="text-sm font-semibold">Metadata</h4>
      <p className="mt-1 text-xs text-muted-foreground">Read-only fields for segmentation context.</p>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4" data-segment-field="source">
          <span className="text-muted-foreground">Source</span>
          <span className="inline-flex items-center gap-1.5">
            <SourceIcon source={contact.source} />
            {sourceLabel(contact.source)}
          </span>
        </div>
        <div className="flex justify-between gap-4" data-segment-field="created_at">
          <span className="text-muted-foreground">Created At</span>
          <span>{formatDateTime(contact.created_at)}</span>
        </div>
        <div className="flex justify-between gap-4" data-segment-field="updated_at">
          <span className="text-muted-foreground">Updated At</span>
          <span>{formatDateTime(contact.updated_at)}</span>
        </div>
        <div className="flex justify-between gap-4" data-segment-field="last_activity_at">
          <span className="text-muted-foreground">Last Interaction</span>
          <span>{formatDateTime(contact.last_activity_at)}</span>
        </div>
        <div className="flex justify-between gap-4" data-segment-field="last_campaign">
          <span className="text-muted-foreground">Last Campaign</span>
          <span className="text-right">
            {contact.last_campaign ? `${contact.last_campaign.name} · ${formatDate(contact.last_campaign.sent_at)}` : "—"}
          </span>
        </div>
        <div className="flex justify-between gap-4" data-segment-field="conversations_count">
          <span className="text-muted-foreground">Conversation Count</span>
          <span>{contact.conversations_count}</span>
        </div>
      </div>
    </section>
  );
}
