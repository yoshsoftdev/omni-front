"use client";

import { RouteTabs, type RouteTab } from "@/components/layout/route-tabs";

const TABS: RouteTab[] = [
  { href: "/contacts", label: "All Contacts", exact: true },
  { href: "/contacts/segments", label: "Segments" },
  { href: "/contacts/tags", label: "Tags" },
  { href: "/contacts/import", label: "Import" },
];

export function ContactsNav() {
  return <RouteTabs tabs={TABS} />;
}
