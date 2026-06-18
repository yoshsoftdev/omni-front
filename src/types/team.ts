export type TeamRole = "owner" | "admin" | "supervisor" | "agent";
export type MemberStatus = "active" | "inactive" | "invited";

export interface Team {
  id: string;
  name: string;
  slug: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: TeamRole;
  role_id?: string;
  status?: MemberStatus;
  last_active_at?: string;
  created_at: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  status: string;
  created_at: string;
}
