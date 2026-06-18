"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SegmentRule, SegmentRuleField, SegmentRuleOperator } from "@/types/segment";

const FIELD_OPTIONS: { value: SegmentRuleField; label: string }[] = [
  { value: "tag", label: "Tag" },
  { value: "city", label: "City" },
  { value: "last_activity", label: "Last Activity" },
  { value: "consent_status", label: "Consent Status" },
  { value: "source", label: "Source" },
];

const OPERATOR_OPTIONS: { value: SegmentRuleOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "less_than", label: "Less Than" },
  { value: "greater_than", label: "Greater Than" },
];

export function SegmentRuleBuilder({
  rules,
  onChange,
}: {
  rules: SegmentRule[];
  onChange: (rules: SegmentRule[]) => void;
}) {
  function addRule() {
    onChange([...rules, { id: `r-${Date.now()}`, field: "tag", operator: "equals", value: "" }]);
  }

  function updateRule(id: string, patch: Partial<SegmentRule>) {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRule(id: string) {
    onChange(rules.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-2">
      {rules.map((rule, index) => (
        <div key={rule.id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-3">
          {index > 0 ? <span className="text-xs font-medium text-muted-foreground">AND</span> : null}
          <select
            className="h-9 rounded-md border px-2 text-sm"
            value={rule.field}
            onChange={(e) => updateRule(rule.id, { field: e.target.value as SegmentRuleField })}
          >
            {FIELD_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border px-2 text-sm"
            value={rule.operator}
            onChange={(e) => updateRule(rule.id, { operator: e.target.value as SegmentRuleOperator })}
          >
            {OPERATOR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Input
            className="h-9 w-40"
            value={rule.value}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
            placeholder="Value"
          />
          <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRule}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add Rule
      </Button>
    </div>
  );
}
