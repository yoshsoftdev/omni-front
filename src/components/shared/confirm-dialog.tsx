"use client";

import { useCallback, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Asks before a destructive action; replaces `window.confirm`. Stays open while `onConfirm` runs. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={busy} onClick={() => void confirm()}>
            {busy ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ConfirmOptions = { title: string; description: string; confirmLabel?: string };

/**
 * Awaitable confirm: `if (!(await confirm({ title, description }))) return;`.
 * Render the returned `dialog` once in the component.
 */
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );
  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.title ?? ""}
      description={pending?.description ?? ""}
      confirmLabel={pending?.confirmLabel}
      onConfirm={() => pending?.resolve(true)}
      onOpenChange={(open) => {
        if (open) return;
        pending?.resolve(false); // no-op after a confirm: a promise settles once
        setPending(null);
      }}
    />
  );
  return [confirm, dialog];
}
