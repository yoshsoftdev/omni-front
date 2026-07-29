"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Inbox,
  Megaphone,
  Users,
  UsersRound,
  Settings,
  MessageSquareQuote,
  LogOut,
  PlugZap,
  CreditCard,
  Sparkles,
  ChevronDown,
  Smartphone,
  Clock3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authService } from "@/features/auth/services/auth.service";
import { useInboxUnreadCount } from "@/features/inbox/hooks/use-inbox-unread-count";
import { cn } from "@/lib/utils";
import { websocketClient } from "@/services/websocket/client";
import { useAuthStore } from "@/store/auth-store";

const broadcastItems = [
  { href: "/broadcast/campaigns", label: "Campaigns" },
  { href: "/broadcast/templates", label: "Templates" },
  { href: "/broadcast/schedules", label: "Schedules" },
  { href: "/broadcast/reports", label: "Reports" },
];

const navItems: Array<{
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  isBroadcastParent?: boolean;
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/devices", label: "Channels", icon: Smartphone },
  { href: "/broadcast/campaigns", label: "Broadcast", icon: Megaphone, isBroadcastParent: true },
  { href: "/automation", label: "Automation", icon: Sparkles },
  { href: "/team/users", label: "Team", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings/quick-replies", label: "Quick Replies", icon: MessageSquareQuote },
  { href: "/settings/window-recontact", label: "Window Recontact", icon: Clock3 },
  { href: "/integrations", label: "Integrations", icon: PlugZap },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const team = useAuthStore((state) => state.team);
  const { badge: inboxUnreadBadge } = useInboxUnreadCount();

  async function handleLogout() {
    await authService.logout();
    websocketClient.disconnect();
    router.replace("/login");
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-14 flex-col justify-center border-b px-4">
        <span className="font-semibold">Omni Chan</span>
        {team ? <span className="truncate text-xs text-muted-foreground">{team.name}</span> : null}
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Special-case "Settings" so it doesn't stay selected for nested routes like
          // "/settings/quick-replies" (otherwise both "Settings" and "Quick Replies" become active).
          const active =
            pathname === item.href ||
            (item.href !== "/settings" && pathname.startsWith(`${item.href}/`)) ||
            (item.href === "/team/users" && pathname.startsWith("/team"));

          if (item.isBroadcastParent) {
            const expanded = pathname.startsWith("/broadcast/");
            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    expanded ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  <ChevronDown
                    className={[
                      "ml-auto h-4 w-4 transition-transform",
                      expanded ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </Link>
                {expanded ? (
                  <div className="space-y-0.5 px-2">
                    {broadcastItems.map((sub) => {
                      const subActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "block rounded-md px-3 py-2 text-sm transition-colors",
                            subActive ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.href === "/inbox" && inboxUnreadBadge
                ? `${item.label} (${inboxUnreadBadge})`
                : item.label}
              {item.href === "/inbox" && inboxUnreadBadge ? (
                <span
                  className={cn(
                    "ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-medium",
                    active
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {inboxUnreadBadge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 space-y-3">
        {user ? <p className="truncate text-xs text-muted-foreground">{user.email}</p> : null}
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
