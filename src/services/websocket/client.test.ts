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

describe("WebSocketClient onConnected (D9 resync)", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    FakeSocket.instances = [];
  });

  // Data the page loaded over HTTP before the first socket opened can miss events too,
  // so the first open must resync just like a reconnect.
  it("notifies on the first open and again when the socket comes back", () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeSocket);
    const client = new WebSocketClient();
    const onConnected = vi.fn();
    client.onConnected(onConnected);

    client.connect("token");
    FakeSocket.instances[0].open();
    expect(onConnected).toHaveBeenCalledTimes(1);

    FakeSocket.instances[0].close(); // network drop
    vi.advanceTimersByTime(3000);
    FakeSocket.instances[1].open();
    expect(onConnected).toHaveBeenCalledTimes(2);
  });

  it("does not notify for an attempt that never opened", () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeSocket);
    const client = new WebSocketClient();
    const onConnected = vi.fn();
    client.onConnected(onConnected);

    client.connect("token");
    FakeSocket.instances[0].close(); // first candidate refused
    expect(onConnected).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    FakeSocket.instances[1].open();
    expect(onConnected).toHaveBeenCalledTimes(1);
  });

  it("stops notifying after unsubscribe", () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeSocket);
    const client = new WebSocketClient();
    const onConnected = vi.fn();
    const off = client.onConnected(onConnected);
    client.connect("token");
    off();
    FakeSocket.instances[0].open();
    expect(onConnected).not.toHaveBeenCalled();
  });
});
