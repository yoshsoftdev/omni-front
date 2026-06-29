import type { PermissionInfo, PermissionMatrixRow } from "@/types/rbac";

function readString(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

export function normalizePermissionInfo(raw: Partial<PermissionInfo> & Record<string, unknown>): PermissionInfo {
  return {
    id: readString(raw.id, raw.ID as string),
    code: readString(raw.code, raw.Code as string),
    name: readString(raw.name, raw.Name as string),
    description: readString(raw.description, raw.Description as string),
  };
}

export function normalizePermissionMatrixRow(
  raw: Partial<PermissionMatrixRow> & Record<string, unknown>,
): PermissionMatrixRow {
  const permissionRaw = (raw.permission ?? raw.Permission ?? {}) as Partial<PermissionInfo> & Record<string, unknown>;
  const rolesRaw = (raw.roles ?? raw.Roles ?? {}) as Record<string, boolean>;
  return {
    permission: normalizePermissionInfo(permissionRaw),
    roles: rolesRaw,
  };
}
