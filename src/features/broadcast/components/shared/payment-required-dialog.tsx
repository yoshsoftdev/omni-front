"use client";

import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

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
    <Dialog open onOpenChange={(next) => !next && !loading && onCancel()}>
      <DialogContent className="max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-muted text-warning-foreground">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>Payment Required</DialogTitle>
            <DialogDescription className="mt-2">Marketing campaigns require a Meta payment method.</DialogDescription>
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
      </DialogContent>
    </Dialog>
  );
}
