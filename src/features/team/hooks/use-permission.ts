"use client";

import { useAuthStore } from "@/store/auth-store";

// shortcut: fallback until /auth/me answers; the server list wins as soon as it loads.
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

/**
 * `can(code)` answers from the permissions the API returned for this session (GET /auth/me),
 * so custom roles and role edits are respected. The role map above is only used until that
 * list has loaded.
 */
export function usePermission() {
  const role = useAuthStore((state) => state.role) ?? "agent";
  const granted = useAuthStore((state) => state.permissions);

  function can(permission: string) {
    if (granted) return granted.includes(permission);
    const perms = ROLE_PERMISSIONS[role] ?? [];
    return perms.includes("*") || perms.includes(permission);
  }

  return { role, can };
}
