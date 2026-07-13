"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContactCustomFieldsForm,
  type CustomFieldValues,
} from "@/features/contacts/components/contact-custom-fields-form";
import { ContactTagSelector } from "@/features/contacts/components/contact-tag-selector";
import type { ContactFieldDefinition, ContactTag, ConsentStatus } from "@/types/contact";

export interface ContactFormValues {
  contact_name: string;
  customer_name: string;
  phone: string;
  email: string;
  consent_status: ConsentStatus;
  country: string;
  province: string;
  city: string;
  company: string;
  job_title: string;
  notes: string;
  tag_ids: string[];
  custom_fields: CustomFieldValues;
}

interface ContactFormModalProps {
  title: string;
  submitLabel: string;
  values: ContactFormValues;
  onChange: (values: ContactFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
  tags: ContactTag[];
  fieldDefinitions: ContactFieldDefinition[];
  phoneReadOnly?: boolean;
  saving?: boolean;
}

export function ContactFormModal({
  title,
  submitLabel,
  values,
  onChange,
  onClose,
  onSubmit,
  tags,
  fieldDefinitions,
  phoneReadOnly = false,
  saving = false,
}: ContactFormModalProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">All fields are available for future segment rules.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 md:col-span-2">
            <Input
              placeholder="Contact Name (Inbox Display) *"
              value={values.contact_name}
              onChange={(e) => onChange({ ...values, contact_name: e.target.value })}
              data-segment-field="contact_name"
            />
            <Input
              placeholder="Customer Name (WhatsApp Profile)"
              value={values.customer_name}
              onChange={(e) => onChange({ ...values, customer_name: e.target.value })}
              data-segment-field="customer_name"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Phone (E.164) *"
                value={values.phone}
                readOnly={phoneReadOnly}
                onChange={(e) => onChange({ ...values, phone: e.target.value })}
                data-segment-field="phone"
              />
              <Input
                placeholder="Email"
                value={values.email}
                onChange={(e) => onChange({ ...values, email: e.target.value })}
                data-segment-field="email"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Subscription</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={values.consent_status}
              onChange={(e) => onChange({ ...values, consent_status: e.target.value as ConsentStatus })}
              data-segment-field="marketing_status"
            >
              <option value="opt_in">Subscribed</option>
              <option value="opt_out">Unsubscribed</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <Input
            placeholder="Company"
            value={values.company}
            onChange={(e) => onChange({ ...values, company: e.target.value })}
            data-segment-field="company"
          />

          <Input
            placeholder="Country (ISO, e.g. ID)"
            value={values.country}
            maxLength={2}
            onChange={(e) => onChange({ ...values, country: e.target.value.toUpperCase().slice(0, 2) })}
            data-segment-field="country"
          />
          <Input
            placeholder="Province"
            value={values.province}
            onChange={(e) => onChange({ ...values, province: e.target.value })}
            data-segment-field="province"
          />
          <Input
            placeholder="City"
            value={values.city}
            onChange={(e) => onChange({ ...values, city: e.target.value })}
            data-segment-field="city"
          />
          <Input
            placeholder="Job Title"
            value={values.job_title}
            onChange={(e) => onChange({ ...values, job_title: e.target.value })}
            data-segment-field="job_title"
          />

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            <ContactTagSelector
              tags={tags}
              selectedIds={values.tag_ids}
              onChange={(tag_ids) => onChange({ ...values, tag_ids })}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea
              className="min-h-[88px] w-full rounded-md border bg-background p-3 text-sm"
              placeholder="Internal notes about this contact"
              value={values.notes}
              onChange={(e) => onChange({ ...values, notes: e.target.value })}
              data-segment-field="notes"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Custom Fields</label>
            <ContactCustomFieldsForm
              fields={fieldDefinitions}
              values={values.custom_fields}
              onChange={(custom_fields) => onChange({ ...values, custom_fields })}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function emptyContactFormValues(): ContactFormValues {
  return {
    contact_name: "",
    customer_name: "",
    phone: "",
    email: "",
    consent_status: "unknown",
    country: "",
    province: "",
    city: "",
    company: "",
    job_title: "",
    notes: "",
    tag_ids: [],
    custom_fields: {},
  };
}

export function contactToFormValues(contact: {
  contact_name?: string;
  customer_name?: string;
  name?: string;
  phone: string;
  email?: string;
  consent_status: ConsentStatus;
  country?: string;
  province?: string;
  city?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  tags: Array<{ id: string }>;
  custom_fields?: Array<{ field_key: string; value: string | number | boolean | null }>;
}): ContactFormValues {
  const custom_fields: CustomFieldValues = {};
  for (const field of contact.custom_fields ?? []) {
    custom_fields[field.field_key] = field.value;
  }
  return {
    contact_name: contact.contact_name ?? contact.name ?? "",
    customer_name: contact.customer_name ?? contact.name ?? "",
    phone: contact.phone,
    email: contact.email ?? "",
    consent_status: contact.consent_status,
    country: contact.country ?? "",
    province: contact.province ?? "",
    city: contact.city ?? "",
    company: contact.company ?? "",
    job_title: contact.job_title ?? "",
    notes: contact.notes ?? "",
    tag_ids: contact.tags.map((tag) => tag.id),
    custom_fields,
  };
}
