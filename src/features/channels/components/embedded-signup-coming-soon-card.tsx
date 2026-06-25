"use client";

import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmbeddedSignupComingSoonCard() {
  return (
    <div className="space-y-4 rounded-lg border border-dashed bg-muted/20 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Embedded Signup (Coexistence)</h2>
          <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-300">Coming Soon</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Waiting for Meta App Review. Use Manual WhatsApp Connection below until Embedded Signup is approved.
          </p>
        </div>
      </div>
      <Button type="button" disabled>
        Start Embedded Signup
      </Button>
    </div>
  );
}
