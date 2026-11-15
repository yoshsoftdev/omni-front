"use client";


import { FilterSelect } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>All fields are available for future segment rules.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 md:col-span-2">
            <Input
              aria-label="Contact Name"
              placeholder="Contact Name (Inbox Display) *"
              value={values.contact_name}
              onChange={(e) => onChange({ ...values, contact_name: e.target.value })}
              data-segment-field="contact_name"
            />
            <Input
              aria-label="Customer Name"
              placeholder="Customer Name (WhatsApp Profile)"
              value={values.customer_name}
              onChange={(e) => onChange({ ...values, customer_name: e.target.value })}
              data-segment-field="customer_name"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                aria-label="Phone"
                placeholder="Phone (E.164) *"
                value={values.phone}
                readOnly={phoneReadOnly}
                onChange={(e) => onChange({ ...values, phone: e.target.value })}
                data-segment-field="phone"
              />
              <Input
                aria-label="Email"
                placeholder="Email"
                value={values.email}
                onChange={(e) => onChange({ ...values, email: e.target.value })}
                data-segment-field="email"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="contact-form-subscription" className="text-xs text-muted-foreground">Subscription</label>
            <FilterSelect
              id="contact-form-subscription"
              label="Subscription"
              value={values.consent_status}
              onChange={(value) => onChange({ ...values, consent_status: value as ConsentStatus })}
              options={[
                { value: "opt_in", label: "Subscribed" },
                { value: "opt_out", label: "Unsubscribed" },
                { value: "unknown", label: "Unknown" },
              ]}
              className="w-full"
            />
          </div>

          <Input
            aria-label="Company"
            placeholder="Company"
            value={values.company}
            onChange={(e) => onChange({ ...values, company: e.target.value })}
            data-segment-field="company"
          />

          <Input
            aria-label="Country"
            placeholder="Country (ISO, e.g. ID)"
            value={values.country}
            maxLength={2}
            onChange={(e) => onChange({ ...values, country: e.target.value.toUpperCase().slice(0, 2) })}
            data-segment-field="country"
          />
          <Input
            aria-label="Province"
            placeholder="Province"
            value={values.province}
            onChange={(e) => onChange({ ...values, province: e.target.value })}
            data-segment-field="province"
          />
          <Input
            aria-label="City"
            placeholder="City"
            value={values.city}
            onChange={(e) => onChange({ ...values, city: e.target.value })}
            data-segment-field="city"
          />
          <Input
            aria-label="Job Title"
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
              aria-label="Notes"
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
