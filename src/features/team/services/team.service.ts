import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth-store";
import type { PermissionMatrixRow, RoleDetail, RoleInfo, WorkspaceDetail } from "@/types/rbac";
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

  async listUsers(params?: { search?: string; role?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<{ users: TeamMember[] }>(`/team/users${suffix}`);
    return response.data?.users ?? [];
  },

  async inviteUser(input: { name: string; email: string; role: TeamRole }) {
    await apiClient.post("/team/users/invite", input);
  },

  async updateUserRole(memberId: string, role: TeamRole) {
    const response = await apiClient.put<TeamMember>(`/team/users/${memberId}/role`, { role });
    return response.data!;
  },

  async deactivateUser(memberId: string) {
    const response = await apiClient.patch<TeamMember>(`/team/users/${memberId}/deactivate`);
    return response.data!;
  },

  async removeUser(memberId: string) {
    await apiClient.delete(`/team/users/${memberId}`);
  },

  async listRoles() {
    const response = await apiClient.get<{ roles: Array<RoleInfo & Record<string, unknown>> }>("/team/roles");
    const roles = response.data?.roles ?? [];
    // Normalize payload keys to handle backend structs without json tags.
    return roles.map((role, index) => ({
      id: String(role.id ?? role.ID ?? `role-${index}`),
      name: String(role.name ?? role.Name ?? ""),
      description: String(role.description ?? role.Description ?? ""),
      is_system: Boolean(role.is_system ?? role.IsSystem ?? false),
    }));
  },

  async getRole(roleId: string) {
    const response = await apiClient.get<RoleDetail>(`/team/roles/${roleId}`);
    return response.data!;
  },

  async getPermissionMatrix() {
    const response = await apiClient.get<{ matrix: PermissionMatrixRow[] }>("/team/permissions");
    return response.data?.matrix ?? [];
  },

  async getWorkspace() {
    const response = await apiClient.get<WorkspaceDetail>("/team/workspace");
    return response.data!;
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
