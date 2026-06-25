import type { ApiResponse, AuthTokens } from "@/types/api";
import { useAuthStore } from "@/store/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

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

  private errorMessage(body: ApiResponse<unknown>, status: number): string {
    if (body.error?.message) {
      return body.error.message;
    }
    if (body.message) {
      return body.message;
    }
    return `Request failed (${status})`;
  }

  private async parseBody<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = (await response.text()).trim();
      if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
        throw new Error(`Server returned HTML instead of JSON (${response.status}). Check API URL and route.`);
      }
      throw new Error(text || "Unexpected server response");
    }
    return (await response.json()) as ApiResponse<T>;
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

    const body = await this.parseBody<T>(response);

    if (response.status === 401 && !skipAuth) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        return this.request<T>(path, options);
      }
      useAuthStore.getState().clearAuth();
    }

    if (!response.ok || body.success === false) {
      throw new Error(this.errorMessage(body, response.status));
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

  async upload<T>(path: string, file: File): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const form = new FormData();
    form.append("file", file);

    const response = await fetch(url, {
      method: "POST",
      headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
      body: form,
    });

    const body = await this.parseBody<T>(response);
    if (!response.ok || body.success === false) {
      throw new Error(this.errorMessage(body, response.status));
    }
    return body;
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

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        return null;
      }

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
