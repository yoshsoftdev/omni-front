import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth-store";
import type { AuthSessionResponse, AuthTokens } from "@/types/api";
import type { InvitationPreview } from "@/types/team";

function mapSession(data: AuthSessionResponse) {
  const tokens: AuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
  useAuthStore.getState().setSession(data.user, data.team, data.role, tokens);
  return { user: data.user, team: data.team, role: data.role, tokens };
}

export const invitationService = {
  async getInvitation(invitationId: string) {
    const response = await apiClient.get<InvitationPreview>(`/invitations/${invitationId}`, {
      skipAuth: true,
    });
    return response.data!;
  },

  async acceptInvitation(invitationId: string, input: { name?: string; password: string }) {
    const response = await apiClient.post<AuthSessionResponse>(
      `/invitations/${invitationId}/accept`,
      input,
      { skipAuth: true },
    );
    return mapSession(response.data!);
  },
};
