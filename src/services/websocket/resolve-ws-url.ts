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

export function resolveWsCandidates(): string[] {
  if (typeof window === "undefined") {
    return [resolveWsBaseUrl()];
  }

  const explicit = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "");
  if (explicit) {
    return [explicit];
  }

  const isHttps = window.location.protocol === "https:";
  const wsProtocol = isHttps ? "wss:" : "ws:";
  const envPort = process.env.NEXT_PUBLIC_BACKEND_PORT ?? "8070";
  const envPortUrl = `${wsProtocol}//${window.location.hostname}:${envPort}/ws`;
  const commonFallback = `${wsProtocol}//${window.location.hostname}:8070/ws`;
  const sameOrigin = `${wsProtocol}//${window.location.host}/ws`;

  // In local HTTP dev, Next (3000) often doesn't proxy WS; try backend port first.
  const ordered = isHttps
    ? [sameOrigin, envPortUrl, commonFallback]
    : [envPortUrl, commonFallback, sameOrigin];

  return Array.from(new Set(ordered));
}
