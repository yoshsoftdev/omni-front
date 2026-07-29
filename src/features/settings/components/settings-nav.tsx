"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/quick-replies", label: "Quick Replies" },
  { href: "/settings/window-recontact", label: "Window Recontact" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 border-b pb-4">
      {SETTINGS_NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
