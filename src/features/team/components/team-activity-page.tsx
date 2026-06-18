"use client";

import Link from "next/link";
import { CalendarDays, MessageCircle, UserCog, Users, WandSparkles } from "lucide-react";

import { MOCK_WORKSPACE_ACTIVITY } from "@/features/team/mock-data";

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
        <div className="space-y-3">
          {MOCK_WORKSPACE_ACTIVITY.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-lg border bg-background p-3">
              {item.type === "invite" ? (
                <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
              ) : item.type === "role" ? (
                <UserCog className="mt-0.5 h-4 w-4 text-muted-foreground" />
              ) : item.type === "wa" ? (
                <MessageCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
              ) : (
                <WandSparkles className="mt-0.5 h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <div className="text-sm">{item.text}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <CalendarDays className="mr-1 inline h-3 w-3" />
                  {item.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
