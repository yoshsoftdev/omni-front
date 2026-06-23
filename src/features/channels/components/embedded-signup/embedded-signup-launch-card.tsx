"use client";

import { CheckCircle2, Clock, Shield, Smartphone, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

type EmbeddedSignupLaunchCardProps = {
  onStart: () => void;
  disabled?: boolean;
};

export function EmbeddedSignupLaunchCard({ onStart, disabled }: EmbeddedSignupLaunchCardProps) {
  return (
    <div className="space-y-5 rounded-lg border bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Launch Embedded Signup</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start the guided Meta flow to connect your existing WhatsApp Business App.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Benefit icon={Zap} title="Fast setup" text="Connect in about 5 minutes with Meta-guided steps." />
        <Benefit icon={Shield} title="Secure access" text="Omni-Chan only receives approved WhatsApp permissions." />
        <Benefit icon={Clock} title="Coexistence ready" text="Keep using WhatsApp Business App alongside Cloud API." />
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <p className="font-medium">Security note</p>
        <p className="mt-1 text-xs">
          You will authorize Omni-Chan to manage templates and send messages on behalf of your business.
          Credentials are stored securely and never shared with third parties.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <p className="text-sm text-muted-foreground">Estimated time: ~5 minutes</p>
        <Button onClick={onStart} disabled={disabled}>
          Start Setup
        </Button>
      </div>
    </div>
  );
}

function Benefit({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Zap;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
