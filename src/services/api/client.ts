import type { ApiResponse, AuthTokens } from "@/types/api";
import { useAuthStore } from "@/store/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

class ApiClient {
  private refreshPromise: Promise<AuthTokens | null> | null = null;

  private get accessToken(): string | null {
    return useAuthStore.getState().tokens?.accessToken ?? null;
  }

  private get refreshToken(): string | null {
    return useAuthStore.getState().tokens?.refreshToken ?? null;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { skipAuth, headers, ...init } = options;
    const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {}),
        ...(!skipAuth && this.accessToken
          ? { Authorization: `Bearer ${this.accessToken}` }
          : {}),
      },
    });

    const body = (await response.json()) as ApiResponse<T>;

    if (response.status === 401 && !skipAuth) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        return this.request<T>(path, options);
      }
      useAuthStore.getState().clearAuth();
    }

    if (!response.ok || body.success === false) {
      throw new Error(body.message || "Request failed");
    }

    return body;
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(path: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(path: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  private async refreshTokens(): Promise<AuthTokens | null> {
    if (!this.refreshToken) {
      return null;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  private async performRefresh(): Promise<AuthTokens | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      const body = (await response.json()) as ApiResponse<{
        access_token: string;
        refresh_token: string;
        user?: unknown;
        team?: unknown;
      }>;

      if (!response.ok || !body.success || !body.data?.access_token) {
        return null;
      }

      const tokens: AuthTokens = {
        accessToken: body.data.access_token,
        refreshToken: body.data.refresh_token,
      };
      useAuthStore.getState().setTokens(tokens);
      return tokens;
    } catch {
      return null;
    }
  }
}

export const apiClient = new ApiClient();
