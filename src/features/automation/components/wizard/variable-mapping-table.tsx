"use client";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import type { VariableMapping } from "@/features/automation/types/action";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";

export function VariableMappingTable({
  mappings,
  onChange,
  readOnly = false,
}: {
  mappings: VariableMapping[];
  onChange?: (next: VariableMapping[]) => void;
  readOnly?: boolean;
}) {
  function update(index: number, patch: Partial<VariableMapping>) {
    if (!onChange) return;
    onChange(mappings.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  if (mappings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No template variables to map.
      </p>
    );
  }

  return (
    <DataTable className="rounded-lg border">
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Template Variable</DataTableHeaderCell>
            <DataTableHeaderCell>API Parameter</DataTableHeaderCell>
            <DataTableHeaderCell>Required</DataTableHeaderCell>
            <DataTableHeaderCell>Default Value</DataTableHeaderCell>
            <DataTableHeaderCell>Description</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          {mappings.map((row, index) => (
            <DataTableRow key={`${row.templateVariable}-${index}`} className="align-top">
              <DataTableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {/^\d+$/.test(row.templateVariable) ? `{{${row.templateVariable}}}` : row.templateVariable}
                </code>
              </DataTableCell>
              <DataTableCell>
                {readOnly ? (
                  <code className="font-mono text-xs">{row.apiParameter}</code>
                ) : (
                  <Input
                    aria-label={`API parameter for ${row.templateVariable}`}
                    value={row.apiParameter}
                    onChange={(e) => update(index, { apiParameter: e.target.value.replace(/\s+/g, "") })}
                    className="h-8 font-mono text-xs"
                  />
                )}
              </DataTableCell>
              <DataTableCell>
                {readOnly ? (
                  row.required ? <StatusBadge tone="warning">Required</StatusBadge> : <StatusBadge tone="neutral">Optional</StatusBadge>
                ) : (
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      aria-label={`${row.templateVariable} required`}
                      checked={row.required}
                      onChange={(e) => update(index, { required: e.target.checked })}
                    />
                    Required
                  </label>
                )}
              </DataTableCell>
              <DataTableCell>
                {readOnly ? (
                  <span className="text-muted-foreground">{row.defaultValue || "—"}</span>
                ) : (
                  <Input
                    aria-label={`Default value for ${row.templateVariable}`}
                    value={row.defaultValue ?? ""}
                    onChange={(e) => update(index, { defaultValue: e.target.value })}
                    placeholder="Optional"
                    className="h-8 text-xs"
                  />
                )}
              </DataTableCell>
              <DataTableCell>
                {readOnly ? (
                  <span className="text-muted-foreground">{row.description || "—"}</span>
                ) : (
                  <div className="space-y-1">
                    <Input
                      aria-label={`Description for ${row.templateVariable}`}
                      value={row.description ?? ""}
                      onChange={(e) => update(index, { description: e.target.value })}
                      placeholder="Describe this parameter"
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
  );
}
