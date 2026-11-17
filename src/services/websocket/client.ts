import { resolveWsCandidates } from "@/services/websocket/resolve-ws-url";

type MessageHandler = (data: MessageEvent) => void;
type ConnectedHandler = () => void;

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers = new Set<MessageHandler>();
  private connectedHandlers = new Set<ConnectedHandler>();
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
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Called every time a socket opens, the first one included. Realtime fan-out is at-most-once (D9):
   * events published before this socket was subscribed are lost, whether that gap was a network
   * drop or the page loading its data before the first connect. Subscribers refetch what they show.
   */
  onConnected(handler: ConnectedHandler) {
    this.connectedHandlers.add(handler);
    return () => {
      this.connectedHandlers.delete(handler);
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
      this.connectedHandlers.forEach((handler) => handler());
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
