"use client";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { actionTypeLabel } from "@/features/automation/actions/registry";
import { CopyButton } from "@/features/automation/components/shared/copy-button";
import type { AutomationEndpoint } from "@/features/automation/types/endpoint";
import {
  endpointInvokeUrl,
  formatNumber,
  formatRelativeTime,
  successRateTone,
} from "@/features/automation/utils/format";
import { isSendTemplateConfig } from "@/features/automation/utils/variable-defaults";

export function EndpointsTable({
  endpoints,
  loading,
  onDisable,
  onEnable,
  onDuplicate,
  onDelete,
}: {
  endpoints: AutomationEndpoint[];
  loading?: boolean;
  onDisable: (id: string) => void;
  onEnable: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DataTable className="hidden md:block">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>Name</DataTableHeaderCell>
              <DataTableHeaderCell>Method</DataTableHeaderCell>
              <DataTableHeaderCell>Endpoint URL</DataTableHeaderCell>
              <DataTableHeaderCell>Action</DataTableHeaderCell>
              <DataTableHeaderCell>Config</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Last Used</DataTableHeaderCell>
              <DataTableHeaderCell>Calls</DataTableHeaderCell>
              <DataTableHeaderCell>Success</DataTableHeaderCell>
              <DataTableHeaderCell><span className="sr-only">Actions</span></DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {endpoints.map((endpoint) => {
              const templateName = isSendTemplateConfig(endpoint.actionConfig)
                ? endpoint.actionConfig.templateName
                : "—";
              const url = endpointInvokeUrl(endpoint.id);
              return (
                <DataTableRow key={endpoint.id} className="hover:bg-muted/20">
                  <DataTableCell>
                    <Link href={`/automation/endpoints/${endpoint.id}`} className="font-medium hover:underline">
                      {endpoint.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{endpoint.slug}</p>
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone="info" status="POST" />
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex max-w-[220px] items-center gap-2">
                      <code className="truncate font-mono text-xs">{endpoint.id}</code>
                      <CopyButton value={url} iconOnly className="h-7 px-2" />
                    </div>
                  </DataTableCell>
                  <DataTableCell>{actionTypeLabel(endpoint.actionType)}</DataTableCell>
                  <DataTableCell className="max-w-[160px] truncate text-muted-foreground">{templateName}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge status={endpoint.status} />
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">{formatRelativeTime(endpoint.lastUsedAt)}</DataTableCell>
                  <DataTableCell>{formatNumber(endpoint.stats.totalCalls)}</DataTableCell>
                  <DataTableCell>
                    <StatusBadge tone={successRateTone(endpoint.stats.successRate)}>
                      {endpoint.stats.successRate}%
                    </StatusBadge>
                  </DataTableCell>
                  <DataTableCell>
                    <EndpointRowMenu
                      endpoint={endpoint}
                      onDisable={onDisable}
                      onEnable={onEnable}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                    />
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
        </DataTable>

      <div className="space-y-3 p-4 md:hidden">
        {endpoints.map((endpoint) => (
          <div key={endpoint.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/automation/endpoints/${endpoint.id}`} className="font-medium hover:underline">
                  {endpoint.name}
                </Link>
                <p className="text-xs text-muted-foreground">{endpoint.slug}</p>
              </div>
              <StatusBadge status={endpoint.status} />
            </div>
            <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{endpoint.id}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{actionTypeLabel(endpoint.actionType)}</span>
              <span>{endpoint.stats.successRate}% · {formatNumber(endpoint.stats.totalCalls)} calls</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EndpointRowMenu({
  endpoint,
  onDisable,
  onEnable,
  onDuplicate,
  onDelete,
}: {
  endpoint: AutomationEndpoint;
  onDisable: (id: string) => void;
  onEnable: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <details className="relative">
      <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md border hover:bg-accent">
        <MoreHorizontal className="h-4 w-4" />
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border bg-card p-1 shadow-sm">
        <Button asChild variant="ghost" className="h-8 w-full justify-start px-2 text-sm font-normal">
          <Link href={`/automation/endpoints/${endpoint.id}`}>View Documentation</Link>
        </Button>
        <Button asChild variant="ghost" className="h-8 w-full justify-start px-2 text-sm font-normal">
          <Link href={`/automation/endpoints/${endpoint.id}?tab=variables`}>Edit</Link>
        </Button>
        <button
          type="button"
          className="flex h-8 w-full items-center rounded-md px-2 text-left text-sm hover:bg-accent"
          onClick={() => onDuplicate(endpoint.id)}
        >
          Duplicate
        </button>
        {endpoint.status === "active" ? (
          <button
            type="button"
            className="flex h-8 w-full items-center rounded-md px-2 text-left text-sm hover:bg-accent"
            onClick={() => onDisable(endpoint.id)}
          >
            Disable
          </button>
        ) : (
          <button
            type="button"
            className="flex h-8 w-full items-center rounded-md px-2 text-left text-sm hover:bg-accent"
            onClick={() => onEnable(endpoint.id)}
          >
            Enable
          </button>
        )}
        <button
          type="button"
          className="flex h-8 w-full items-center rounded-md px-2 text-left text-sm text-destructive hover:bg-accent"
          onClick={() => onDelete(endpoint.id)}
        >
          Delete
        </button>
      </div>
    </details>
  );
}
