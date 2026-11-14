"use client";

import { RouteTabs, type RouteTab } from "@/components/layout/route-tabs";

const TABS: RouteTab[] = [
  { href: "/settings/appearance", label: "Appearance" },
  { href: "/settings/quick-replies", label: "Quick Replies" },
  { href: "/settings/window-recontact", label: "Window Recontact" },
];

export function SettingsNav() {
  return <RouteTabs tabs={TABS} />;
}
