import { test as base, expect, type Page, type Request, type Route } from "@playwright/test";

/** One recorded browser → backend call (path is relative to /api/v1). */
export interface ApiCall {
  method: string;
  path: string;
  body: unknown;
  authorization: string | null;
}

type Handler = (route: Route, request: Request) => Promise<void> | void;

export interface ApiMock {
  /** Register a handler for METHOD + path (relative to /api/v1, exact match). */
  on(method: string, path: string, handler: Handler): void;
  /** Respond with the standard success envelope. */
  ok(method: string, path: string, data: unknown, status?: number): void;
  /** Respond with the standard error envelope. */
  fail(method: string, path: string, message: string, status: number): void;
  calls: ApiCall[];
  /** Calls that hit no registered handler (they get 501 so the UI surfaces them). */
  unmatched: ApiCall[];
}

const API_PREFIX = "/api/v1";

function key(method: string, path: string) {
  return `${method.toUpperCase()} ${path}`;
}

export async function installApiMock(page: Page): Promise<ApiMock> {
  const handlers = new Map<string, Handler>();
  const calls: ApiCall[] = [];
  const unmatched: ApiCall[] = [];

  await page.route(`**${API_PREFIX}/**`, async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname.slice(url.pathname.indexOf(API_PREFIX) + API_PREFIX.length);
    let body: unknown = null;
    const raw = request.postData();
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = raw;
      }
    }
    const call: ApiCall = {
      method: request.method(),
      path,
      body,
      authorization: request.headers()["authorization"] ?? null,
    };
    calls.push(call);

    const handler = handlers.get(key(call.method, path));
    if (handler) {
      await handler(route, request);
      return;
    }
    unmatched.push(call);
    await route.fulfill({
      status: 501,
      contentType: "application/json",
      body: JSON.stringify({ success: false, message: `e2e: no mock for ${call.method} ${path}` }),
    });
  });

  return {
    calls,
    unmatched,
    on(method, path, handler) {
      handlers.set(key(method, path), handler);
    },
    ok(method, path, data, status = 200) {
      handlers.set(key(method, path), (route) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data }),
        }),
      );
    },
    fail(method, path, message, status) {
      handlers.set(key(method, path), (route) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify({ success: false, message }),
        }),
      );
    },
  };
}

export const test = base.extend<{ api: ApiMock }>({
  api: async ({ page }, provide) => {
    // Realtime socket: e2e covers HTTP flows only, so close it in the browser.
    await page.routeWebSocket(/\/ws(\?|$)/, (ws) => ws.close());
    const api = await installApiMock(page);
    await provide(api);
  },
});

export { expect };

/** Test identity shared by specs. Not a real account. */
export const TEST_SESSION = {
  user: { id: "11111111-1111-4111-8111-111111111111", email: "agent@example.test", name: "E2E Agent" },
  team: { id: "22222222-2222-4222-8222-222222222222", name: "E2E Team", slug: "e2e-team" },
  role: "owner",
  access_token: "e2e-access-token",
  refresh_token: "e2e-refresh-token",
};

/** Start the page already signed in (same persisted store the app writes). */
export async function signIn(page: Page) {
  await page.addInitScript((s) => {
    localStorage.setItem(
      "omni-chan-auth",
      JSON.stringify({
        state: {
          tokens: { accessToken: s.access_token, refreshToken: s.refresh_token },
          user: s.user,
          team: s.team,
          role: s.role,
        },
        version: 0,
      }),
    );
  }, TEST_SESSION);
}

/** Responses for calls every dashboard page makes (badges, nav). */
export function mockShell(api: ApiMock) {
  api.ok("GET", "/dashboard", { unread_conversations: 0 });
  api.ok("GET", "/channels", { items: [] });
}

/** Calls of one method+path, in order. */
export function callsTo(api: ApiMock, method: string, path: string): ApiCall[] {
  return api.calls.filter((c) => c.method === method && c.path === path);
}
