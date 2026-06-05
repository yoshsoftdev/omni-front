"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Smartphone,
  UsersRound,
  Settings,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authService } from "@/features/auth/services/auth.service";
import { cn } from "@/lib/utils";
import { websocketClient } from "@/services/websocket/client";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/devices", label: "Devices", icon: Smartphone },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const team = useAuthStore((state) => state.team);

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
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

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
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        {user ? (
          <p className="mb-2 truncate text-xs text-muted-foreground">{user.email}</p>
        ) : null}
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
