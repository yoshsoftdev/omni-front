"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Bell, HelpCircle, UserCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
          <span className="text-sm font-semibold md:hidden">Omni Chan</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                2
              </span>
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Help"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <div className="ml-1 hidden items-center gap-2 rounded-md border bg-background px-2 py-1 md:flex">
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              <div className="leading-tight">
                <div className="text-xs font-medium">{user?.email ?? "Admin"}</div>
                <div className="text-[10px] text-muted-foreground">Admin</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
