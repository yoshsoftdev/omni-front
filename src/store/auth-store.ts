import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthTeam, AuthTokens, AuthUser } from "@/types/api";

interface AuthState {
  user: AuthUser | null;
  team: AuthTeam | null;
  role: string | null;
  tokens: AuthTokens | null;
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
      tokens: null,
      setSession: (user, team, role, tokens) => set({ user, team, role, tokens }),
      setTokens: (tokens) => set({ tokens }),
      clearAuth: () => set({ user: null, team: null, role: null, tokens: null }),
      isAuthenticated: () => Boolean(get().tokens?.accessToken),
    }),
    {
      name: "omni-chan-auth",
      partialize: (state) => ({
        tokens: state.tokens,
        user: state.user,
        team: state.team,
        role: state.role,
      }),
    },
  ),
);
