/**
 * Resolves the WebSocket base URL (without query string).
 *
 * - HTTPS pages use same-origin `wss://` (reverse proxy must forward `/ws`).
 * - HTTP dev can use direct backend port (LAN IP) or same-origin via Next rewrite.
 * - Override anytime with NEXT_PUBLIC_WS_URL.
 */
export function resolveWsBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }

  if (typeof window === "undefined") {
    const port = process.env.NEXT_PUBLIC_BACKEND_PORT ?? "8090";
    return `ws://127.0.0.1:${port}/ws`;
  }

  const useSameOrigin =
    window.location.protocol === "https:" ||
    process.env.NEXT_PUBLIC_WS_SAME_ORIGIN === "true";

  if (useSameOrigin) {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}/ws`;
  }

  const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT ?? "8090";
  return `ws://${window.location.hostname}:${backendPort}/ws`;
}
