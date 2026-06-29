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
  invitation_id: string;
  invite_url: string;
  expires_at?: string;
  role: TeamRole;
}

export interface InvitationPreview {
  invitation_id: string;
  email: string;
  name: string;
  role: TeamRole;
  team_name: string;
  team_slug: string;
  expires_at?: string;
}
