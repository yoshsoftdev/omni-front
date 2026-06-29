"use client";

import { Input } from "@/components/ui/input";
import type { ContactFieldDefinition } from "@/types/contact";

export type CustomFieldValues = Record<string, string | number | boolean | null | undefined>;

export function ContactCustomFieldsForm({
  fields,
  values,
  onChange,
}: {
  fields: Array<ContactFieldDefinition & { value?: string | number | boolean | null }>;
  values: CustomFieldValues;
  onChange: (values: CustomFieldValues) => void;
}) {
  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No custom fields configured. Field definitions can be added via API for segmentation.
      </p>
    );
  }

  function update(fieldKey: string, value: string | number | boolean | null) {
    onChange({ ...values, [fieldKey]: value });
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const current = values[field.field_key] ?? field.value ?? "";
        const inputId = `custom-field-${field.field_key}`;

        if (field.field_type === "boolean") {
          return (
            <label key={field.id} htmlFor={inputId} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{field.label}</span>
              <input
                id={inputId}
                type="checkbox"
                checked={Boolean(current)}
                onChange={(e) => update(field.field_key, e.target.checked)}
                className="rounded border"
              />
            </label>
          );
        }

        if (field.field_type === "select") {
          return (
            <div key={field.id} className="space-y-1">
              <label htmlFor={inputId} className="text-xs text-muted-foreground">{field.label}</label>
              <select
                id={inputId}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={String(current ?? "")}
                onChange={(e) => update(field.field_key, e.target.value || null)}
              >
                <option value="">Select {field.label}</option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div key={field.id} className="space-y-1">
            <label htmlFor={inputId} className="text-xs text-muted-foreground">{field.label}</label>
            <Input
              id={inputId}
              type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
              value={current === null || current === undefined ? "" : String(current)}
              onChange={(e) => {
                if (field.field_type === "number") {
                  update(field.field_key, e.target.value === "" ? null : Number(e.target.value));
                  return;
                }
                update(field.field_key, e.target.value);
              }}
              data-field-key={field.field_key}
              data-segment-field={`custom.${field.field_key}`}
            />
          </div>
        );
      })}
    </div>
  );
}

export function ContactCustomFieldsReadOnly({
  fields,
}: {
  fields: Array<{ label: string; field_key: string; field_type: string; value: string | number | boolean | null }>;
}) {
  if (fields.length === 0) {
    return <p className="text-sm text-muted-foreground">No custom field values.</p>;
  }

  function formatValue(value: string | number | boolean | null, fieldType: string) {
    if (value === null || value === undefined || value === "") return "—";
    if (fieldType === "boolean") return value ? "Yes" : "No";
    return String(value);
  }

  return (
    <div className="space-y-2 text-sm">
      {fields.map((field) => (
        <div
          key={field.field_key}
          className="flex justify-between gap-4"
          data-segment-field={`custom.${field.field_key}`}
        >
          <span className="text-muted-foreground">{field.label}</span>
          <span className="text-right">{formatValue(field.value, field.field_type)}</span>
        </div>
      ))}
    </div>
  );
}
