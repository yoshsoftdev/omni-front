"use client";

import { RouteTabs, type RouteTab } from "@/components/layout/route-tabs";

const TABS: RouteTab[] = [
  { href: "/team/users", label: "Users" },
  { href: "/team/roles", label: "Roles" },
  { href: "/team/permissions", label: "Permissions" },
  { href: "/team/workspace", label: "Workspace" },
];

export function TeamNav() {
  return <RouteTabs tabs={TABS} />;
}
