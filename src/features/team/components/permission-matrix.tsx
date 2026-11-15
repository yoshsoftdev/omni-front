"use client";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { PermissionMatrixRow } from "@/types/rbac";

const ROLE_COLUMNS = ["owner", "admin", "supervisor", "agent"];

export function PermissionMatrix({
  rows,
  editable = false,
  onToggle,
}: {
  rows: PermissionMatrixRow[];
  editable?: boolean;
  onToggle?: (rowIndex: number, role: string) => void | Promise<void>;
}) {
  const [localRows, setLocalRows] = useState(rows);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const data = editable ? localRows : rows;

  const columns = useMemo(() => {
    const discovered = new Set<string>();
    data.forEach((row) => Object.keys(row.roles).forEach((r) => discovered.add(r)));
    return ROLE_COLUMNS.filter((r) => discovered.has(r));
  }, [data]);

  function toggle(rowIndex: number, role: string) {
    if (!editable) return;
    if (onToggle) {
      void onToggle(rowIndex, role);
      return;
    }
    setLocalRows((prev) =>
      prev.map((row, idx) =>
        idx === rowIndex
          ? { ...row, roles: { ...row.roles, [role]: !row.roles[role] } }
          : row,
      ),
    );
  }

  return (
    <DataTable className="rounded-lg border bg-card">
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Permission</DataTableHeaderCell>
            {columns.map((role) => (
              <DataTableHeaderCell key={role} className="text-center capitalize">
                {role}
              </DataTableHeaderCell>
            ))}
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          {data.map((row, rowIndex) => (
            <DataTableRow key={row.permission.code}>
              <DataTableCell>
                <div className="font-medium">{row.permission.name}</div>
                <div className="text-xs text-muted-foreground">{row.permission.code}</div>
              </DataTableCell>
              {columns.map((role) => {
                const allowed = row.roles[role];
                return (
                  <DataTableCell key={role} className="p-4 text-center">
                    {editable ? (
                      <button
                        type="button"
                        onClick={() => toggle(rowIndex, role)}
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                          allowed
                            ? "border-success-border bg-success-muted text-success-foreground"
                            : "border-muted bg-background text-muted-foreground",
                        )}
                      >
                        {allowed ? "✓" : "—"}
                      </button>
                    ) : (
                      <span className={allowed ? "text-success-foreground" : "text-muted-foreground"}>
                        {allowed ? "✓" : "—"}
                      </span>
                    )}
                  </DataTableCell>
                );
              })}
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
  );
}
