"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmbeddedSignupProgressState } from "@/features/channels/types/embedded-signup";
import { PROGRESS_STATE_LABELS } from "@/features/channels/types/embedded-signup";
import { cn } from "@/lib/utils";

const STATE_ORDER: EmbeddedSignupProgressState[] = [
  "initializing",
  "waiting_user_action",
  "verifying_assets",
  "syncing",
  "completed",
];

type EmbeddedSignupProgressProps = {
  state: EmbeddedSignupProgressState;
  onConfirmUserAction?: () => void;
  error?: string | null;
};

export function EmbeddedSignupProgress({ state, onConfirmUserAction, error }: EmbeddedSignupProgressProps) {
  const currentIndex = STATE_ORDER.indexOf(state);

  return (
    <div className="space-y-5 rounded-lg border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Connecting your WhatsApp channel</h2>
        <p className="mt-1 text-sm text-muted-foreground">{PROGRESS_STATE_LABELS[state]}</p>
      </div>

      <ol className="space-y-3">
        {STATE_ORDER.map((item, index) => {
          const done = index < currentIndex || state === "completed";
          const active = index === currentIndex && state !== "completed";
          return (
            <li
              key={item}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                active && "border-primary/40 bg-primary/5",
                done && "text-muted-foreground",
              )}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span>{PROGRESS_STATE_LABELS[item]}</span>
            </li>
          );
        })}
      </ol>

      {state === "waiting_user_action" ? (
        <div className="rounded-md border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Action required</p>
          <p className="mt-1 text-muted-foreground">
            In a real integration, Meta Embedded Signup would open here. For this demo, confirm when
            you have completed the Meta authorization steps.
          </p>
          <Button className="mt-3" size="sm" onClick={onConfirmUserAction}>
            I completed Meta setup
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
