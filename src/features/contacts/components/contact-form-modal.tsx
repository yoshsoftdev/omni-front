"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ConsentStatus } from "@/types/contact";

export interface ContactFormValues {
  name: string;
  phone: string;
  email: string;
  consent_status: ConsentStatus;
}

interface ContactFormModalProps {
  title: string;
  submitLabel: string;
  values: ContactFormValues;
  onChange: (values: ContactFormValues) => void;
  onClose: () => void;
  onSubmit: () => void;
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
  phoneReadOnly = false,
  saving = false,
}: ContactFormModalProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <Input
            placeholder="Full Name"
            value={values.name}
            onChange={(e) => onChange({ ...values, name: e.target.value })}
          />
          <Input
            placeholder="Phone Number"
            value={values.phone}
            readOnly={phoneReadOnly}
            onChange={(e) => onChange({ ...values, phone: e.target.value })}
          />
          <Input
            placeholder="Email"
            value={values.email}
            onChange={(e) => onChange({ ...values, email: e.target.value })}
          />
          <select
            className="h-10 w-full rounded-md border px-3 text-sm"
            value={values.consent_status}
            onChange={(e) => onChange({ ...values, consent_status: e.target.value as ConsentStatus })}
          >
            <option value="opt_in">Marketing Opt-In</option>
            <option value="opt_out">Marketing Opt-Out</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
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
