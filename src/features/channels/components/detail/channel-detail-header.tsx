"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight, ExternalLink, MoreHorizontal, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProviderIcon } from "@/components/shared/provider-badge";
import { ChannelConnectionBadge } from "@/features/channels/components/detail/channel-detail-primitives";
import type { ChannelKind } from "@/features/channels/utils/channel-display";
import { kindLabel, providerIconTone } from "@/features/channels/utils/channel-display";
import type { Channel } from "@/features/channels/types/channel";
import { cn } from "@/lib/utils";

type ChannelDetailHeaderProps = {
  channel: Channel;
  kind: ChannelKind;
  secondaryLine: string;
  tertiaryLine?: string;
  openExternalLabel: string;
  canManage: boolean;
  onReconnect: () => void;
  onOpenExternal: () => void;
  openExternalDisabled?: boolean;
  onDelete: () => void;
};

export function ChannelDetailHeader({
  channel,
  kind,
  secondaryLine,
  tertiaryLine,
  openExternalLabel,
  canManage,
  onReconnect,
  onOpenExternal,
  openExternalDisabled,
  onDelete,
}: ChannelDetailHeaderProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const tone = providerIconTone(kind);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>Channels</span>
        <ChevronRight className="h-3 w-3" />
        <span>{kindLabel(kind)}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{channel.label}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", tone.wrap)}>
            <ProviderIcon provider={kind} className={cn("h-6 w-6", tone.icon)} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">
                {kind === "whatsapp" ? `${kindLabel(kind)} ${channel.label}` : channel.label}
              </h2>
              <ChannelConnectionBadge status={channel.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{secondaryLine}</p>
            {tertiaryLine ? <p className="text-xs text-muted-foreground">{tertiaryLine}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" type="button" disabled={!canManage} onClick={onReconnect}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Reconnect
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={openExternalDisabled}
            onClick={onOpenExternal}
          >
            {openExternalLabel}
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
          <div className="relative" ref={moreRef}>
            <Button variant="outline" size="sm" type="button" onClick={() => setMoreOpen((v) => !v)}>
              More
              <MoreHorizontal className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            {moreOpen ? (
              <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border bg-popover p-1 shadow-md">
                {canManage ? (
                  <button
                    type="button"
                    className="w-full rounded px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                    onClick={() => {
                      setMoreOpen(false);
                      onDelete();
                    }}
                  >
                    Delete Channel
                  </button>
                ) : (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No actions available</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChannelDetailShell({
  main,
  sidebar,
}: {
  main: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
      <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="space-y-5">{main}</div>
      </main>
      <aside className="w-full shrink-0 border-t border-border bg-background p-4 xl:w-[280px] xl:border-l xl:border-t-0">
        {sidebar}
      </aside>
    </div>
  );
}
