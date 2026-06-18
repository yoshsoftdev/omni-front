"use client";

import { useMemo, useState } from "react";

import type { PermissionMatrixRow } from "@/types/rbac";
import { cn } from "@/lib/utils";

const ROLE_COLUMNS = ["owner", "admin", "supervisor", "agent"];

export function PermissionMatrix({
  rows,
  editable = false,
}: {
  rows: PermissionMatrixRow[];
  editable?: boolean;
}) {
  const [localRows, setLocalRows] = useState(rows);

  const data = editable ? localRows : rows;

  const columns = useMemo(() => {
    const discovered = new Set<string>();
    data.forEach((row) => Object.keys(row.roles).forEach((r) => discovered.add(r)));
    return ROLE_COLUMNS.filter((r) => discovered.has(r));
  }, [data]);

  function toggle(rowIndex: number, role: string) {
    if (!editable) return;
    setLocalRows((prev) =>
      prev.map((row, idx) =>
        idx === rowIndex
          ? { ...row, roles: { ...row.roles, [role]: !row.roles[role] } }
          : row,
      ),
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className="p-4 font-medium">Permission</th>
            {columns.map((role) => (
              <th key={role} className="p-4 text-center font-medium capitalize">
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.permission.code} className="border-b last:border-0">
              <td className="p-4">
                <div className="font-medium">{row.permission.name}</div>
                <div className="text-xs text-muted-foreground">{row.permission.code}</div>
              </td>
              {columns.map((role) => {
                const allowed = row.roles[role];
                return (
                  <td key={role} className="p-4 text-center">
                    {editable ? (
                      <button
                        type="button"
                        onClick={() => toggle(rowIndex, role)}
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                          allowed
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-muted bg-background text-muted-foreground",
                        )}
                      >
                        {allowed ? "✓" : "—"}
                      </button>
                    ) : (
                      <span className={allowed ? "text-emerald-600" : "text-muted-foreground"}>
                        {allowed ? "✓" : "—"}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {editable ? (
        <p className="border-t p-3 text-xs text-muted-foreground">
          Toggle changes are mock-only and are not saved to the server yet.
        </p>
      ) : null}
    </div>
  );
}
