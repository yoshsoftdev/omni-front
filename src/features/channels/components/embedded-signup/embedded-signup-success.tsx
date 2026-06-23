"use client";

import Link from "next/link";
import { Building2, CheckCircle2, MessageSquare, Phone, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EmbeddedSignupResult } from "@/features/channels/types/embedded-signup";

type EmbeddedSignupSuccessProps = {
  result: EmbeddedSignupResult;
};

export function EmbeddedSignupSuccess({ result }: EmbeddedSignupSuccessProps) {
  return (
    <div className="space-y-5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
        <div>
          <h2 className="text-lg font-semibold">WhatsApp connected successfully</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your channel is ready. Continue with template sync and your first campaign.
          </p>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <SuccessItem icon={Phone} label="Connected Number" value={result.phone_number} />
        <SuccessItem icon={Smartphone} label="WABA Name" value={result.waba_name} />
        <SuccessItem icon={Building2} label="Business Name" value={result.business_name} />
        <SuccessItem icon={MessageSquare} label="Imported Templates" value={String(result.templates_imported)} />
      </dl>

      <div className="border-t pt-4">
        <p className="text-sm font-medium">Next actions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/broadcast/templates">Sync Templates</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/broadcast/campaigns/create">Create Campaign</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SuccessItem({
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
