export type TeamRole = "owner" | "admin" | "agent";

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
  created_at: string;
}
