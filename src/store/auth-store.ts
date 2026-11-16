import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthTeam, AuthTokens, AuthUser } from "@/types/api";

interface AuthState {
  user: AuthUser | null;
  team: AuthTeam | null;
  role: string | null;
  /** From GET /auth/me; null until loaded for this session. */
  permissions: string[] | null;
  tokens: AuthTokens | null;
  setPermissions: (permissions: string[]) => void;
  setSession: (user: AuthUser, team: AuthTeam, role: string, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      team: null,
      role: null,
      permissions: null,
      tokens: null,
      setPermissions: (permissions) => set({ permissions }),
      // A new session (login, team switch) drops the previous permission list.
      setSession: (user, team, role, tokens) =>
        set((state) => ({ user, team, role, tokens, permissions: state.role === role ? state.permissions : null })),
      setTokens: (tokens) => set({ tokens }),
      clearAuth: () => set({ user: null, team: null, role: null, permissions: null, tokens: null }),
      isAuthenticated: () => Boolean(get().tokens?.accessToken),
    }),
    {
      name: "omni-chan-auth",
      partialize: (state) => ({
        tokens: state.tokens,
        user: state.user,
        team: state.team,
        role: state.role,
        permissions: state.permissions,
      }),
    },
  ),
);
