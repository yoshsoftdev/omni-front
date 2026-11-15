"use client";

import { useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { TeamInvitation } from "@/types/team";

function formatExpiry(date?: string) {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InvitationSuccessDialog({
  invitation,
  onClose,
}: {
  invitation: TeamInvitation;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const expiryLabel = formatExpiry(invitation.expires_at);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(invitation.invite_url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-success-foreground" />
          <div>
            <DialogTitle>Invitation created successfully</DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Copy this invitation link
              {expiryLabel ? ` (valid until ${expiryLabel})` : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-md border bg-muted/40 p-3">
          <p className="break-all font-mono text-sm">{invitation.invite_url}</p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => void handleCopy()}>
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copied" : "Copy Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
