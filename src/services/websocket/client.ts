import { resolveWsCandidates } from "@/services/websocket/resolve-ws-url";

type MessageHandler = (data: MessageEvent) => void;
type ReconnectHandler = () => void;

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers = new Set<MessageHandler>();
  private reconnectHandlers = new Set<ReconnectHandler>();
  /** True once a socket has opened; a later open is a reconnect (events may have been missed). */
  private hasOpened = false;
  private shouldReconnect = true;
  private token: string | null = null;
  private currentUrlIndex = 0;

  connect(token: string) {
    if (this.token === token && this.socket) {
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
    }
    this.token = token;
    this.shouldReconnect = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.currentUrlIndex = 0;
    this.open();
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.currentUrlIndex = 0;
    this.hasOpened = false; // next connect (new session) is a fresh start, not a resync
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Called after the socket comes back. Realtime fan-out is at-most-once (D9),
   * so subscribers refetch what they show instead of trusting the event stream.
   */
  onReconnect(handler: ReconnectHandler) {
    this.reconnectHandlers.add(handler);
    return () => {
      this.reconnectHandlers.delete(handler);
    };
  }

  send(payload: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  private open() {
    if (!this.token) return;

    const candidates = resolveWsCandidates();
    if (candidates.length === 0) return;
    const baseUrl = candidates[this.currentUrlIndex % candidates.length];
    const url = `${baseUrl}?token=${encodeURIComponent(this.token)}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.currentUrlIndex = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.hasOpened) {
        this.reconnectHandlers.forEach((handler) => handler());
      }
      this.hasOpened = true;
    };

    this.socket.onmessage = (event) => {
      this.handlers.forEach((handler) => handler(event));
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (this.shouldReconnect) {
        this.currentUrlIndex += 1;
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.open();
    }, 3000);
  }
}

export const websocketClient = new WebSocketClient();
