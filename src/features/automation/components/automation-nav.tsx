"use client";

import { RouteTabs, type RouteTab } from "@/components/layout/route-tabs";

const TABS: RouteTab[] = [
  { href: "/automation", label: "Overview", exact: true },
  { href: "/automation/endpoints", label: "API Endpoints" },
  { href: "/automation/keys", label: "API Keys" },
  { href: "/automation/webhooks", label: "Webhooks" },
  { href: "/automation/workflows", label: "Workflows", disabled: true },
];

export function AutomationNav() {
  return <RouteTabs tabs={TABS} />;
}
