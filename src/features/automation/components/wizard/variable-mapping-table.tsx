"use client";

import type { VariableMapping } from "@/features/automation/types/action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2.5 font-medium">Template Variable</th>
            <th className="px-3 py-2.5 font-medium">API Parameter</th>
            <th className="px-3 py-2.5 font-medium">Required</th>
            <th className="px-3 py-2.5 font-medium">Default Value</th>
            <th className="px-3 py-2.5 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((row, index) => (
            <tr key={`${row.templateVariable}-${index}`} className="border-b last:border-0 align-top">
              <td className="px-3 py-3">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {/^\d+$/.test(row.templateVariable) ? `{{${row.templateVariable}}}` : row.templateVariable}
                </code>
              </td>
              <td className="px-3 py-3">
                {readOnly ? (
                  <code className="font-mono text-xs">{row.apiParameter}</code>
                ) : (
                  <Input
                    value={row.apiParameter}
                    onChange={(e) => update(index, { apiParameter: e.target.value.replace(/\s+/g, "") })}
                    className="h-8 font-mono text-xs"
                  />
                )}
              </td>
              <td className="px-3 py-3">
                {readOnly ? (
                  row.required ? <StatusBadge tone="warning">Required</StatusBadge> : <StatusBadge tone="neutral">Optional</StatusBadge>
                ) : (
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={row.required}
                      onChange={(e) => update(index, { required: e.target.checked })}
                    />
                    Required
                  </label>
                )}
              </td>
              <td className="px-3 py-3">
                {readOnly ? (
                  <span className="text-muted-foreground">{row.defaultValue || "—"}</span>
                ) : (
                  <Input
                    value={row.defaultValue ?? ""}
                    onChange={(e) => update(index, { defaultValue: e.target.value })}
                    placeholder="Optional"
                    className="h-8 text-xs"
                  />
                )}
              </td>
              <td className="px-3 py-3">
                {readOnly ? (
                  <span className="text-muted-foreground">{row.description || "—"}</span>
                ) : (
                  <div className="space-y-1">
                    <Label className="sr-only">Description</Label>
                    <Input
                      value={row.description ?? ""}
                      onChange={(e) => update(index, { description: e.target.value })}
                      placeholder="Describe this parameter"
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
