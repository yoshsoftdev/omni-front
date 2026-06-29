import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth-store";
import {
  normalizeInviteResult,
  normalizeRole,
  normalizeTeamMember,
} from "@/features/team/mappers/team.mapper";
import { normalizePermissionInfo, normalizePermissionMatrixRow } from "@/features/team/mappers/rbac.mapper";
import type { PermissionInfo, PermissionMatrixRow, RoleDetail, RoleInfo, WorkspaceDetail } from "@/types/rbac";
import type { Team, TeamInvitation, TeamMember, TeamRole } from "@/types/team";

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
    const response = await apiClient.get<{ members?: TeamMember[] }>("/teams/members");
    const rows = response.data?.members ?? [];
    return rows.map((row) => normalizeTeamMember(row as TeamMember & Record<string, unknown>));
  },

  async listUsers(params?: { search?: string; role?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await apiClient.get<{ users?: TeamMember[] }>(`/teams/users${suffix}`);
    const rows = response.data?.users ?? [];
    return rows.map((row) => normalizeTeamMember(row as TeamMember & Record<string, unknown>));
  },

  async inviteUser(input: { name: string; email: string; role: TeamRole }): Promise<TeamInvitation> {
    const response = await apiClient.post<Record<string, unknown>>("/teams/users/invite", input);
    return normalizeInviteResult(response.data ?? {});
  },

  async updateUserRole(memberId: string, role: TeamRole) {
    const response = await apiClient.patch<TeamMember>(`/teams/users/${memberId}/role`, { role });
    return normalizeTeamMember(response.data! as TeamMember & Record<string, unknown>);
  },

  async deactivateUser(memberId: string) {
    const response = await apiClient.post<TeamMember>(`/teams/users/${memberId}/deactivate`);
    return normalizeTeamMember(response.data! as TeamMember & Record<string, unknown>);
  },

  async removeUser(memberId: string) {
    await apiClient.delete(`/teams/users/${memberId}`);
  },

  async listRoles(): Promise<RoleInfo[]> {
    const response = await apiClient.get<{ roles?: Array<RoleInfo & Record<string, unknown>> }>("/teams/roles");
    const rows = response.data?.roles ?? [];
    return rows.map((row) => normalizeRole(row));
  },

  async getRole(roleId: string) {
    const response = await apiClient.get<RoleDetail>(`/teams/roles/${roleId}`);
    const detail = response.data!;
    return {
      role: normalizeRole(detail.role as RoleInfo & Record<string, unknown>),
      permissions: (detail.permissions ?? []).map((row) =>
        normalizePermissionInfo(row as PermissionInfo & Record<string, unknown>),
      ),
    } satisfies RoleDetail;
  },

  async getPermissionMatrix() {
    const response = await apiClient.get<{ matrix?: Array<PermissionMatrixRow & Record<string, unknown>> }>(
      "/teams/permissions",
    );
    const rows = response.data?.matrix ?? [];
    return rows.map((row) => normalizePermissionMatrixRow(row));
  },

  async createRole(input: { name: string; description: string }) {
    const response = await apiClient.post<RoleInfo & Record<string, unknown>>("/teams/roles", input);
    return normalizeRole(response.data!);
  },

  async updateRole(roleId: string, input: { name?: string; description: string }) {
    const response = await apiClient.patch<RoleInfo & Record<string, unknown>>(`/teams/roles/${roleId}`, input);
    return normalizeRole(response.data!);
  },

  async deleteRole(roleId: string) {
    await apiClient.delete(`/teams/roles/${roleId}`);
  },

  async updateRolePermissions(roleId: string, permissions: string[]) {
    await apiClient.put(`/teams/roles/${roleId}/permissions`, { permissions });
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
    return normalizeTeamMember(response.data! as TeamMember & Record<string, unknown>);
  },

  async updateMemberRole(memberId: string, role: TeamRole) {
    return this.updateUserRole(memberId, role);
  },

  async removeMember(memberId: string) {
    return this.removeUser(memberId);
  },
};
