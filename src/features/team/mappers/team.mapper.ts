import type { RoleInfo } from "@/types/rbac";
import type { TeamInvitation, TeamMember, TeamRole } from "@/types/team";

function readString(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

const TEAM_ROLES: TeamRole[] = ["owner", "admin", "supervisor", "agent"];

function normalizeRoleName(raw?: string): TeamRole {
  const value = (raw ?? "").toLowerCase() as TeamRole;
  return TEAM_ROLES.includes(value) ? value : "agent";
}

export function normalizeTeamMember(raw: Partial<TeamMember> & Record<string, unknown>): TeamMember {
  const id = readString(raw.id, raw.ID as string);
  const createdAt = readString(raw.created_at, raw.CreatedAt as string) || new Date(0).toISOString();
  const statusRaw = readString(raw.status, raw.Status as string).toLowerCase();

  return {
    id,
    user_id: readString(raw.user_id, raw.UserID as string),
    email: readString(raw.email, raw.Email as string),
    name: readString(raw.name, raw.Name as string),
    role: normalizeRoleName(readString(raw.role, raw.Role as string)),
    role_id: readString(raw.role_id, raw.RoleID as string) || undefined,
    status: (statusRaw || "active") as TeamMember["status"],
    last_active_at: readString(raw.last_active_at, raw.LastActiveAt as string) || undefined,
    created_at: createdAt,
  };
}

export function normalizeRole(raw: Partial<RoleInfo> & Record<string, unknown>): RoleInfo {
  return {
    id: readString(raw.id, raw.ID as string),
    name: readString(raw.name, raw.Name as string),
    description: readString(raw.description, raw.Description as string),
    is_system: Boolean(raw.is_system ?? raw.IsSystem),
  };
}

export function buildInviteUrl(invitationId: string) {
  if (typeof window === "undefined") {
    return `/invite/${invitationId}`;
  }
  return `${window.location.origin}/invite/${invitationId}`;
}

export function normalizeInviteResult(raw: Record<string, unknown>): TeamInvitation {
  const invitationId = readString(
    raw.invitation_id as string,
    raw.id as string,
    raw.ID as string,
  );
  const inviteUrl = readString(raw.invite_url as string, raw.InviteURL as string) || buildInviteUrl(invitationId);
  const expiresAt = readString(raw.expires_at as string, raw.ExpiresAt as string);

  return {
    invitation_id: invitationId,
    invite_url: inviteUrl,
    expires_at: expiresAt || undefined,
    role: normalizeRoleName(readString(raw.role as string, raw.Role as string)),
  };
}
