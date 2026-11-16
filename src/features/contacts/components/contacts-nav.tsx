"use client";

import { RouteTabs, type RouteTab } from "@/components/layout/route-tabs";
import { usePermission } from "@/features/team/hooks/use-permission";
import { PERM } from "@/lib/permissions";

const TABS: RouteTab[] = [
  { href: "/contacts", label: "All Contacts", exact: true },
  { href: "/contacts/segments", label: "Segments" },
  { href: "/contacts/tags", label: "Tags" },
  { href: "/contacts/import", label: "Import" },
];

export function ContactsNav() {
  const { can } = usePermission();
  // Import creates and updates contacts, so it needs contact.create (TEAM-04).
  return <RouteTabs tabs={TABS.filter((tab) => tab.href !== "/contacts/import" || can(PERM.contactCreate))} />;
}
