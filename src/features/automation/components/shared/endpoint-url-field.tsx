"use client";

import { CopyButton } from "@/features/automation/components/shared/copy-button";
import { endpointInvokeUrl } from "@/features/automation/utils/format";
import { cn } from "@/lib/utils";

export function EndpointUrlField({
  endpointId,
  method = "POST",
  className,
}: {
  endpointId: string;
  method?: string;
  className?: string;
}) {
  const url = endpointInvokeUrl(endpointId);

  return (
    <div className={cn("flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center", className)}>
      <span className="shrink-0 rounded-md border bg-muted px-2 py-1 text-xs font-medium">{method}</span>
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground sm:text-sm">{url}</code>
      <CopyButton value={url} label="Copy URL" />
    </div>
  );
}
