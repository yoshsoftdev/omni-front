"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/automation", label: "Overview", exact: true },
  { href: "/automation/endpoints", label: "API Endpoints" },
  { href: "/automation/keys", label: "API Keys" },
  { href: "/automation/webhooks", label: "Webhooks" },
  { href: "/automation/workflows", label: "Workflows", disabled: true },
];

export function AutomationNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b">
      {TABS.map((tab) => {
        if (tab.disabled) {
          return (
            <span
              key={tab.href}
              title="Coming soon"
              className="cursor-not-allowed pb-3 text-sm text-muted-foreground/60"
            >
              {tab.label}
              <span className="ml-1 text-[10px] uppercase tracking-wide">Soon</span>
            </span>
          );
        }
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 pb-3 text-sm transition-colors",
              active
                ? "border-b-2 border-primary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
