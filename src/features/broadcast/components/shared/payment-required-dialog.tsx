"use client";

import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaymentRequiredDialogProps = {
  open: boolean;
  loading?: boolean;
  onAddPayment: () => void;
  onCancel: () => void;
};

export function PaymentRequiredDialog({
  open,
  loading = false,
  onAddPayment,
  onCancel,
}: PaymentRequiredDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Payment Required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Marketing campaigns require a Meta payment method.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onAddPayment} disabled={loading}>
            {loading ? "Opening..." : "Add Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
