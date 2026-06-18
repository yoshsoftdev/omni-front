"use client";

import { useAuthStore } from "@/store/auth-store";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ["*"],
  admin: [
    "team.manage", "user.view", "user.invite", "user.update", "user.delete",
    "contact.view", "contact.create", "contact.update", "contact.delete",
    "conversation.view", "conversation.reply", "conversation.assign",
    "campaign.view", "campaign.create", "campaign.send",
    "template.view", "template.create", "template.sync",
    "report.view", "device.view", "device.manage",
  ],
  supervisor: [
    "team.manage", "user.view", "user.update",
    "contact.view", "conversation.view", "conversation.reply", "conversation.assign",
    "campaign.view", "template.view", "report.view", "device.view",
  ],
  agent: [
    "contact.view", "conversation.view", "conversation.reply", "template.view", "device.view",
  ],
};

export function usePermission() {
  const role = useAuthStore((state) => state.role) ?? "agent";

  function can(permission: string) {
    const perms = ROLE_PERMISSIONS[role] ?? [];
    return perms.includes("*") || perms.includes(permission);
  }

  return { role, can };
}
