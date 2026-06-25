"use client";

import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";

export function TeamActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workspace Activity</h1>
        <p className="text-muted-foreground">Recent activities inside your workspace.</p>
      </div>

      <div className="flex items-center gap-6 border-b">
        <Link href="/team/users" className="pb-3 text-sm text-muted-foreground hover:text-foreground">
          Members
        </Link>
        <Link href="/team/workspace" className="pb-3 text-sm text-muted-foreground hover:text-foreground">
          Workspace
        </Link>
        <span className="border-b-2 border-primary pb-3 text-sm font-medium text-foreground">Activity</span>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <EmptyState message="No workspace activity yet." />
      </section>
    </div>
  );
}
