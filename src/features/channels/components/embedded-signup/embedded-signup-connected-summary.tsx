"use client";

import { Building2, CheckCircle2, Phone, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmbeddedSignupResult } from "@/features/channels/types/embedded-signup";

type EmbeddedSignupConnectedSummaryProps = {
  result: EmbeddedSignupResult;
  onContinue: () => void;
};

export function EmbeddedSignupConnectedSummary({
  result,
  onContinue,
}: EmbeddedSignupConnectedSummaryProps) {
  return (
    <div className="space-y-5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
        <div>
          <h2 className="text-lg font-semibold">WhatsApp Connected</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your channel is connected. Review the details below, then continue to payment setup.
          </p>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <SummaryItem icon={Building2} label="Business" value={result.business_name ?? result.business_id ?? "—"} />
        <SummaryItem icon={Phone} label="Phone" value={result.phone_number || "—"} />
        <SummaryItem icon={Radio} label="Connection Status" value="Connected" />
        <SummaryItem icon={CheckCircle2} label="Channel Status" value="Connected" />
      </dl>

      <div className="flex justify-end border-t pt-4">
        <Button onClick={onContinue}>Continue to Payment</Button>
      </div>
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
