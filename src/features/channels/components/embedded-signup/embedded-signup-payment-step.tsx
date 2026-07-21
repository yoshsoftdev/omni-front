"use client";

import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";

type EmbeddedSignupPaymentStepProps = {
  loading?: boolean;
  onAddPayment: () => void;
  onSkip?: () => void;
  hideSkip?: boolean;
};

export function EmbeddedSignupPaymentStep({
  loading = false,
  onAddPayment,
  onSkip,
  hideSkip = false,
}: EmbeddedSignupPaymentStepProps) {
  return (
    <div className="space-y-5 rounded-lg border bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next Step</p>
          <h2 className="mt-1 text-lg font-semibold">Add Payment Method</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A payment method is required before sending marketing campaigns.
          </p>
          {!hideSkip ? (
            <p className="mt-1 text-sm text-muted-foreground">You can skip this step for now.</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onAddPayment} disabled={loading}>
          {loading ? "Opening..." : "Add Payment"}
        </Button>
        {!hideSkip && onSkip ? (
          <Button variant="outline" onClick={onSkip} disabled={loading}>
            Skip
          </Button>
        ) : null}
      </div>
    </div>
  );
}
