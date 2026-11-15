"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/shared/filter-bar";
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
          <FilterSelect
            label={`Rule ${index + 1} field`}
            value={rule.field}
            onChange={(value) => updateRule(rule.id, { field: value as SegmentRuleField })}
            options={FIELD_OPTIONS}
            className="h-9 min-w-0"
          />
          <FilterSelect
            label={`Rule ${index + 1} operator`}
            value={rule.operator}
            onChange={(value) => updateRule(rule.id, { operator: value as SegmentRuleOperator })}
            options={OPERATOR_OPTIONS}
            className="h-9 min-w-0"
          />
          <Input
            aria-label={`Rule ${index + 1} value`}
            className="h-9 w-40"
            value={rule.value}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
            placeholder="Value"
          />
          <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)} aria-label={`Remove rule ${index + 1}`}>
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
