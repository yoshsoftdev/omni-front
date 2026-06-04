import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth-store";
import type { Team, TeamMember, TeamRole } from "@/types/team";

export const teamService = {
  async getTeam() {
    const response = await apiClient.get<Team>("/teams");
    const team = response.data!;
    useAuthStore.getState().setSession(
      useAuthStore.getState().user!,
      { id: team.id, name: team.name, slug: team.slug },
      useAuthStore.getState().role!,
      useAuthStore.getState().tokens!,
    );
    return team;
  },

  async updateTeam(name: string) {
    const response = await apiClient.patch<Team>("/teams", { name });
    const team = response.data!;
    useAuthStore.getState().setSession(
      useAuthStore.getState().user!,
      { id: team.id, name: team.name, slug: team.slug },
      useAuthStore.getState().role!,
      useAuthStore.getState().tokens!,
    );
    return team;
  },

  async listMembers() {
    const response = await apiClient.get<{ members: TeamMember[] }>("/teams/members");
    return response.data?.members ?? [];
  },

  async addMember(email: string, role: TeamRole) {
    const response = await apiClient.post<TeamMember>("/teams/members", { email, role });
    return response.data!;
  },

  async updateMemberRole(memberId: string, role: TeamRole) {
    const response = await apiClient.patch<TeamMember>(`/teams/members/${memberId}`, { role });
    return response.data!;
  },

  async removeMember(memberId: string) {
    await apiClient.delete(`/teams/members/${memberId}`);
  },
};
