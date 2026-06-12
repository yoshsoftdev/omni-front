import { resolveWsBaseUrl } from "@/services/websocket/resolve-ws-url";

type MessageHandler = (data: MessageEvent) => void;

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers = new Set<MessageHandler>();
  private shouldReconnect = true;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    this.shouldReconnect = true;
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
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(payload: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  private open() {
    if (!this.token) return;

    const url = `${resolveWsBaseUrl()}?token=${encodeURIComponent(this.token)}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.socket.onmessage = (event) => {
      this.handlers.forEach((handler) => handler(event));
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (this.shouldReconnect) {
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
