"use client";

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import type { Channel } from "@/features/channels/types/channel";

export function ChannelConnectionBadge({ status }: { status: Channel["status"] }) {
  if (status === "connected") {
    return <StatusBadge tone="success">Connected</StatusBadge>;
  }
  if (status === "connecting") {
    return <StatusBadge tone="warning">Connecting</StatusBadge>;
  }
  return <StatusBadge tone="neutral">Disconnected</StatusBadge>;
}

export function InfoCell({
  label,
  value,
  positive,
  tone,
}: {
  label: string;
  value: string;
  positive?: boolean;
  tone?: "success" | "warning" | "error" | "neutral";
}) {
  const resolved = tone ?? (positive ? "success" : "neutral");
  const valueClass =
    resolved === "success"
      ? "text-success-foreground"
      : resolved === "warning"
        ? "text-warning-foreground"
        : resolved === "error"
          ? "text-error-foreground"
          : "text-foreground";

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium", valueClass)}>{value}</p>
    </div>
  );
}

export function StatusMetric({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
        ) : (
          <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden />
        )}
        <span className={cn("text-sm font-semibold", ok ? "text-success-foreground" : "text-foreground")}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function DetailCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {icon ? <span className="mt-0.5 text-muted-foreground">{icon}</span> : null}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
