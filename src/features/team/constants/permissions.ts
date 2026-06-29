import type { PermissionMatrixRow } from "@/types/rbac";
import type { TeamRole } from "@/types/team";

export const PERMISSION_ROWS = [
  "Inbox & Conversations",
  "Contacts",
  "Templates",
  "Broadcast Campaigns",
  "Reports",
  "Billing",
  "Workspace Settings",
] as const;

export type PermissionRow = (typeof PERMISSION_ROWS)[number];

export const PERMISSION_BY_ROLE: Record<string, Record<PermissionRow, boolean>> = {
  owner: {
    "Inbox & Conversations": true,
    Contacts: true,
    Templates: true,
    "Broadcast Campaigns": true,
    Reports: true,
    Billing: true,
    "Workspace Settings": true,
  },
  admin: {
    "Inbox & Conversations": true,
    Contacts: true,
    Templates: true,
    "Broadcast Campaigns": true,
    Reports: true,
    Billing: false,
    "Workspace Settings": false,
  },
  supervisor: {
    "Inbox & Conversations": true,
    Contacts: true,
    Templates: false,
    "Broadcast Campaigns": false,
    Reports: true,
    Billing: false,
    "Workspace Settings": false,
  },
  agent: {
    "Inbox & Conversations": true,
    Contacts: true,
    Templates: false,
    "Broadcast Campaigns": false,
    Reports: false,
    Billing: false,
    "Workspace Settings": false,
  },
};

export const PERMISSION_ROW_CODES: Record<PermissionRow, string[]> = {
  "Inbox & Conversations": [
    "inbox.view",
    "inbox.send",
    "inbox.update",
    "conversation.view",
    "conversation.reply",
    "conversation.assign",
  ],
  Contacts: ["contact.view", "contact.create", "contact.update", "contact.delete", "contact.import"],
  Templates: ["template.view", "template.create", "template.sync"],
  "Broadcast Campaigns": [
    "campaign.view",
    "campaign.create",
    "campaign.update",
    "campaign.schedule",
    "campaign.send",
    "campaign.cancel",
    "campaign.delete",
  ],
  Reports: ["report.view"],
  Billing: ["billing.view", "billing.manage"],
  "Workspace Settings": [
    "workspace.manage",
    "team.manage",
    "user.view",
    "user.invite",
    "user.update",
    "user.delete",
  ],
};

export function matrixToPermissionsByRole(
  matrix: PermissionMatrixRow[],
  roles: Array<{ name: string }>,
): Record<string, Record<PermissionRow, boolean>> {
  const grantsByRole: Record<string, Set<string>> = {};
  for (const role of roles) {
    grantsByRole[role.name] = new Set<string>();
  }
  for (const row of matrix) {
    for (const [roleName, allowed] of Object.entries(row.roles)) {
      if (!allowed) continue;
      if (!grantsByRole[roleName]) grantsByRole[roleName] = new Set<string>();
      grantsByRole[roleName].add(row.permission.code);
    }
  }

  const result: Record<string, Record<PermissionRow, boolean>> = {};
  for (const role of roles) {
    const granted = grantsByRole[role.name] ?? new Set<string>();
    result[role.name] = {} as Record<PermissionRow, boolean>;
    for (const rowName of PERMISSION_ROWS) {
      const codes = PERMISSION_ROW_CODES[rowName];
      result[role.name][rowName] = codes.some((code) => granted.has(code));
    }
  }
  return result;
}

export function permissionsByRoleToCodes(
  permissionsByRole: Record<string, Record<PermissionRow, boolean>>,
  roleSlug: string,
): string[] {
  const perms = permissionsByRole[roleSlug];
  if (!perms) return [];
  const codes = new Set<string>();
  for (const rowName of PERMISSION_ROWS) {
    if (!perms[rowName]) continue;
    for (const code of PERMISSION_ROW_CODES[rowName]) {
      codes.add(code);
    }
  }
  return [...codes];
}

export function roleCodesFromMatrix(matrix: PermissionMatrixRow[], roleName: string): string[] {
  return matrix.filter((row) => row.roles[roleName]).map((row) => row.permission.code);
}

export function buildPermissionPreview(
  permissionsByRole: Record<string, Record<PermissionRow, boolean>>,
  roleSlug: string,
): string[] {
  const perms = permissionsByRole[roleSlug];
  if (!perms) return [];
  return PERMISSION_ROWS.filter((row) => perms[row]);
}

export function buildPermissionMatrixRows(): PermissionMatrixRow[] {
  return PERMISSION_ROWS.map((row, index) => ({
    permission: {
      id: `perm-${index}`,
      code: row.toLowerCase().replace(/[^a-z0-9]+/g, "."),
      name: row,
      description: "",
    },
    roles: Object.fromEntries(
      Object.entries(PERMISSION_BY_ROLE).map(([role, perms]) => [role, perms[row]]),
    ),
  }));
}

export interface RoleDef {
  id: string;
  slug: string;
  title: string;
  description: string;
  bullets: string[];
  is_system: boolean;
}

const ROLE_BULLETS: Record<TeamRole, string[]> = {
  owner: ["Billing", "Workspace Settings", "Users", "Campaigns"],
  admin: ["Contacts", "Templates", "Campaigns", "Reports"],
  supervisor: ["Assignments", "Reports", "Monitoring"],
  agent: ["Assigned Inbox", "Contacts View"],
};

export function mapApiRolesToDefs(
  roles: Array<{ id: string; name: string; description: string; is_system: boolean }>,
): RoleDef[] {
  return roles.map((role) => ({
    id: role.id || role.name,
    slug: role.name,
    title: role.name.charAt(0).toUpperCase() + role.name.slice(1),
    description: role.description,
    bullets: ROLE_BULLETS[role.name as TeamRole] ?? [],
    is_system: role.is_system,
  }));
}
