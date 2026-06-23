"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

type OnboardingLayoutProps = {
  children: ReactNode;
  sidebar: ReactNode;
};

export function OnboardingLayout({ children, sidebar }: OnboardingLayoutProps) {
  const team = useAuthStore((state) => state.team);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Workspace Onboarding</p>
          <h1 className="text-2xl font-semibold tracking-tight">{team?.name ?? "Your Workspace"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete setup to send your first WhatsApp campaign.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Resume Later
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">{sidebar}</aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
