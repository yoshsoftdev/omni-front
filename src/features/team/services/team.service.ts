import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth-store";
import type { PermissionMatrixRow, RoleDetail, RoleInfo, WorkspaceDetail } from "@/types/rbac";
import type { Team, TeamMember, TeamRole } from "@/types/team";

export const teamService = {
  async getTeam() {
    const response = await apiClient.get<Team>("/workspace");
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
    const response = await apiClient.patch<Team>("/workspace", { name });
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
    const response = await apiClient.get<{ users: TeamMember[] }>(`/teams/users${suffix}`);
    return response.data?.users ?? [];
  },

  async inviteUser(input: { name: string; email: string; role: TeamRole }) {
    await apiClient.post("/teams/users/invite", input);
  },

  async updateUserRole(memberId: string, role: TeamRole) {
    const response = await apiClient.patch<TeamMember>(`/teams/users/${memberId}/role`, { role });
    return response.data!;
  },

  async deactivateUser(memberId: string) {
    const response = await apiClient.post<TeamMember>(`/teams/users/${memberId}/deactivate`);
    return response.data!;
  },

  async removeUser(memberId: string) {
    await apiClient.delete(`/teams/users/${memberId}`);
  },

  async listRoles() {
    const response = await apiClient.get<{ roles: Array<RoleInfo & Record<string, unknown>> }>("/teams/roles");
    const roles = response.data?.roles ?? [];
    return roles.map((role, index) => ({
      id: String(role.id ?? role.ID ?? `role-${index}`),
      name: String(role.name ?? role.Name ?? ""),
      description: String(role.description ?? role.Description ?? ""),
      is_system: Boolean(role.is_system ?? role.IsSystem ?? false),
    }));
  },

  async getRole(roleId: string) {
    const roles = await this.listRoles();
    const role = roles.find((item) => item.id === roleId);
    if (!role) {
      throw new Error("Role not found");
    }
    return { role, permissions: [] } satisfies RoleDetail;
  },

  async getPermissionMatrix() {
    return [] as PermissionMatrixRow[];
  },

  async getWorkspace() {
    const response = await apiClient.get<Team>("/workspace");
    const team = response.data!;
    return {
      id: team.id,
      name: team.name,
      slug: team.slug,
      owner_name: "",
      owner_id: "",
      created_at: "",
    } satisfies WorkspaceDetail;
  },

  async addMember(email: string, role: TeamRole) {
    const response = await apiClient.post<TeamMember>("/teams/members", { email, role });
    return response.data!;
  },

  async updateMemberRole(memberId: string, role: TeamRole) {
    return this.updateUserRole(memberId, role);
  },

  async removeMember(memberId: string) {
    return this.removeUser(memberId);
  },
};
