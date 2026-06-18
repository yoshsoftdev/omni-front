"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/contacts", label: "All Contacts", exact: true },
  { href: "/contacts/segments", label: "Segments" },
  { href: "/contacts/tags", label: "Tags" },
  { href: "/contacts/import", label: "Import" },
];

export function ContactsNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-6 border-b">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "pb-3 text-sm transition-colors",
              active ? "border-b-2 border-primary font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
