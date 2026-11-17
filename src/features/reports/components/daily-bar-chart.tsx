"use client";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * One series of daily counts as thin bars (rounded tops on the baseline, 2px gaps). Each bar has a
 * hover/focus tooltip; the same numbers are available as a table for screen readers and print.
 */
export function DailyBarChart({
  title,
  days,
}: {
  title: string;
  days: { date: string; value: number }[];
}) {
  const max = Math.max(1, ...days.map((d) => d.value));
  const label = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <figure className="space-y-3">
      <figcaption className="text-sm font-semibold">{title}</figcaption>
      <div className="flex h-40 items-end gap-0.5 border-b border-border" aria-hidden>
        {days.map((d) => (
          <Tooltip key={d.date} content={`${label(d.date)}: ${d.value.toLocaleString()}`}>
            <div className="flex h-full min-w-0 flex-1 items-end" tabIndex={-1}>
              <div
                className="w-full rounded-t bg-primary/80 hover:bg-primary"
                style={{ height: d.value === 0 ? "0" : `${Math.max((d.value / max) * 100, 2)}%` }}
              />
            </div>
          </Tooltip>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden>
        <span>{days[0] ? label(days[0].date) : ""}</span>
        <span>{days.length ? label(days[days.length - 1].date) : ""}</span>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Show as table</summary>
        <DataTable className="mt-2">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>Date</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">{title}</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {days.map((d) => (
              <DataTableRow key={d.date}>
                <DataTableCell>{label(d.date)}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{d.value.toLocaleString()}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </details>
    </figure>
  );
}
