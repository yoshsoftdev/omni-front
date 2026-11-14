import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/websocket/resolve-ws-url", () => ({ resolveWsCandidates: () => ["ws://test/ws"] }));

import { WebSocketClient } from "@/services/websocket/client";

class FakeSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static instances: FakeSocket[] = [];
  readyState = FakeSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((e: unknown) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }
  open() {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }
  close() {
    this.onclose?.();
  }
  send() {}
}

describe("WebSocketClient reconnect (D9 resync)", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    FakeSocket.instances = [];
  });

  it("notifies onReconnect only when the socket comes back, not on the first open", () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeSocket);
    const client = new WebSocketClient();
    const onReconnect = vi.fn();
    client.onReconnect(onReconnect);

    client.connect("token");
    FakeSocket.instances[0].open();
    expect(onReconnect).not.toHaveBeenCalled();

    FakeSocket.instances[0].close(); // network drop
    vi.advanceTimersByTime(3000);
    FakeSocket.instances[1].open();
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it("does not treat a new session after disconnect as a reconnect", () => {
    vi.stubGlobal("WebSocket", FakeSocket);
    const client = new WebSocketClient();
    const onReconnect = vi.fn();
    client.onReconnect(onReconnect);

    client.connect("token-a");
    FakeSocket.instances[0].open();
    client.disconnect(); // sign out
    client.connect("token-b");
    FakeSocket.instances[1].open();
    expect(onReconnect).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeSocket);
    const client = new WebSocketClient();
    const onReconnect = vi.fn();
    const off = client.onReconnect(onReconnect);
    client.connect("token");
    FakeSocket.instances[0].open();
    off();
    FakeSocket.instances[0].close();
    vi.advanceTimersByTime(3000);
    FakeSocket.instances[1].open();
    expect(onReconnect).not.toHaveBeenCalled();
  });
});
