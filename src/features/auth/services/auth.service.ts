import { dispatchClearSessionCache } from "@/components/providers/query-provider";
import {
  clearAppLocalStorage,
  readLastAuthIdentity,
  shouldClearStorageForNextUser,
  writeLastAuthIdentity,
} from "@/features/auth/lib/session-identity";
import { useEmbeddedSignupStore } from "@/features/channels/store/embedded-signup-store";
import { presenceService } from "@/features/inbox/services/presence.service";
import { useInboxCacheStore } from "@/features/inbox/store/inbox-cache-store";
import { useOnboardingStore } from "@/features/workspace/store/onboarding-store";
import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth-store";
import type { AuthSessionResponse, AuthTokens, AuthUser, MeResponse } from "@/types/api";

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

function resetInMemorySessionState() {
  useAuthStore.getState().clearAuth();
  useEmbeddedSignupStore.getState().reset();
  useOnboardingStore.getState().reset();
  useInboxCacheStore.getState().clearAll();
  dispatchClearSessionCache();
}

function clearSessionStorageForDifferentUser(next: { userId?: string; email: string }) {
  const previous = readLastAuthIdentity();
  if (!shouldClearStorageForNextUser(previous, next)) {
    return false;
  }
  clearAppLocalStorage({ keepLastIdentity: true });
  resetInMemorySessionState();
  return true;
}

function rememberAuthIdentity(user: AuthUser) {
  writeLastAuthIdentity({ userId: user.id, email: user.email });
}

function mapSession(data: AuthSessionResponse) {
  const previous = useAuthStore.getState();
  const tenantChanged =
    previous.user?.id !== data.user.id || previous.team?.id !== data.team.id;

  const signup = useEmbeddedSignupStore.getState();
  if (tenantChanged || signup.ownerTeamId !== data.team.id) {
    signup.reset();
  }
  signup.bindTeam(data.team.id);

  const tokens: AuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
  useAuthStore.getState().setSession(data.user, data.team, data.role, tokens);
  rememberAuthIdentity(data.user);
  return { user: data.user, team: data.team, role: data.role, tokens };
}

export const authService = {
  async register(input: RegisterInput) {
    // New account always starts with a clean browser session.
    clearAppLocalStorage({ keepLastIdentity: true });
    resetInMemorySessionState();

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
    const data = response.data!;

    // After auth succeeds, wipe previous tenant/browser state if identity differs.
    clearSessionStorageForDifferentUser({
      userId: data.user.id,
      email: data.user.email || input.email,
    });

    return mapSession(data);
  },

  async logout() {
    const auth = useAuthStore.getState();
    if (auth.user?.id && auth.user.email) {
      writeLastAuthIdentity({ userId: auth.user.id, email: auth.user.email });
    }

    const refreshToken = auth.tokens?.refreshToken;
    // Clear collision presence while the access token is still valid.
    await presenceService.closeActive();
    try {
      await apiClient.post(
        "/auth/logout",
        { refresh_token: refreshToken },
        { skipAuth: true },
      );
    } finally {
      useEmbeddedSignupStore.getState().reset();
      useOnboardingStore.getState().reset();
      useInboxCacheStore.getState().clearAll();
      dispatchClearSessionCache();
      useAuthStore.getState().clearAuth();
    }
  },

  async me() {
    const response = await apiClient.get<MeResponse>("/auth/me");
    const data = response.data!;
    useAuthStore.getState().setSession(data.user, data.team, data.role, useAuthStore.getState().tokens!);
    rememberAuthIdentity(data.user);
    return data;
  },
};

export type AuthService = typeof authService;
