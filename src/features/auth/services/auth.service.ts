import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth-store";
import type { AuthSessionResponse, AuthTokens, MeResponse } from "@/types/api";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  teamName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function mapSession(data: AuthSessionResponse) {
  const tokens: AuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
  useAuthStore.getState().setSession(data.user, data.team, data.role, tokens);
  return { user: data.user, team: data.team, role: data.role, tokens };
}

export const authService = {
  async register(input: RegisterInput) {
    const response = await apiClient.post<AuthSessionResponse>(
      "/auth/register",
      {
        name: input.name,
        email: input.email,
        password: input.password,
        team_name: input.teamName,
      },
      { skipAuth: true },
    );
    return mapSession(response.data!);
  },

  async login(input: LoginInput) {
    const response = await apiClient.post<AuthSessionResponse>(
      "/auth/login",
      input,
      { skipAuth: true },
    );
    return mapSession(response.data!);
  },

  async logout() {
    const refreshToken = useAuthStore.getState().tokens?.refreshToken;
    try {
      await apiClient.post(
        "/auth/logout",
        { refresh_token: refreshToken },
        { skipAuth: true },
      );
    } finally {
      useAuthStore.getState().clearAuth();
    }
  },

  async me() {
    const response = await apiClient.get<MeResponse>("/auth/me");
    const data = response.data!;
    useAuthStore.getState().setSession(data.user, data.team, data.role, useAuthStore.getState().tokens!);
    return data;
  },
};

export type AuthService = typeof authService;
