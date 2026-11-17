import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveWsCandidates } from "@/services/websocket/resolve-ws-url";

function at(href: string) {
  vi.stubGlobal("window", { location: new URL(href) });
}

describe("resolveWsCandidates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("tries the backend port first on plain HTTP dev", () => {
    at("http://192.168.1.5:3000/inbox");
    expect(resolveWsCandidates()[0]).toBe("ws://192.168.1.5:8066/ws");
  });

  it("tries same origin first on HTTPS", () => {
    at("https://app.example.com/inbox");
    expect(resolveWsCandidates()[0]).toBe("wss://app.example.com/ws");
  });

  // Docker staging over HTTP proxies /ws through Next; the backend port is not published there.
  it("tries same origin first on HTTP when NEXT_PUBLIC_WS_SAME_ORIGIN=true", () => {
    vi.stubEnv("NEXT_PUBLIC_WS_SAME_ORIGIN", "true");
    at("http://127.0.0.1:8095/inbox");
    expect(resolveWsCandidates()[0]).toBe("ws://127.0.0.1:8095/ws");
  });
});
