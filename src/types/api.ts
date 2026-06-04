export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthTeam {
  id: string;
  name: string;
  slug: string;
}

export interface AuthSessionResponse {
  user: AuthUser;
  team: AuthTeam;
  role: string;
  access_token: string;
  refresh_token: string;
}

export interface MeResponse {
  user: AuthUser;
  team: AuthTeam;
  role: string;
}
