"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type RouteTab = {
  href: string;
  label: string;
  /** Active only on this exact path (for a section's index tab). */
  exact?: boolean;
  /** Shown but not navigable, labelled "Soon". */
  disabled?: boolean;
};

/** Section sub-navigation where each tab is its own route (Contacts, Team, Settings, Automation). */
export function RouteTabs({ tabs, className }: { tabs: RouteTab[]; className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-6 overflow-x-auto border-b", className)}>
      {tabs.map((tab) => {
        if (tab.disabled) {
          return (
            <span key={tab.href} title="Coming soon" className="shrink-0 cursor-not-allowed pb-3 text-sm text-muted-foreground/60">
              {tab.label}
              <span className="ml-1 text-xs uppercase tracking-wide">Soon</span>
            </span>
          );
        }
        const active = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 pb-3 text-sm transition-colors",
              active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
