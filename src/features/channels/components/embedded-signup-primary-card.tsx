"use client";

import Link from "next/link";
import { CheckCircle2, Shield, Smartphone, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmbeddedSignupPrimaryCard() {
  return (
    <div className="space-y-5 rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Recommended</p>
          <h2 className="mt-1 text-lg font-semibold">Connect with Meta</h2>
          <p className="mt-1 text-sm text-muted-foreground">Embedded Signup (Coexistence)</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
          Primary
        </span>
      </div>

      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Automatic setup
        </li>
        <li className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          Secure OAuth
        </li>
        <li className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-600" />
          Automatic webhook
        </li>
        <li className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-emerald-600" />
          Automatic token management
        </li>
      </ul>

      <Button asChild className="w-full sm:w-auto">
        <Link href="/devices/embedded-signup?returnTo=/devices">Continue with Meta</Link>
      </Button>
    </div>
  );
}
