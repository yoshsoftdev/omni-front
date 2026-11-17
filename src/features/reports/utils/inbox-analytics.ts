/** Inbox analytics (GET /reports/inbox). Durations are seconds; null when nothing to measure. */
export interface InboxAnalytics {
  summary: {
    conversations_started: number;
    messages_received: number;
    messages_sent_by_agents: number;
    first_response_median_seconds: number | null;
    first_response_p90_seconds: number | null;
    resolved: number;
    resolution_median_seconds: number | null;
    unanswered: number;
    open_now: number;
  };
  daily: { date: string; conversations_started: number; messages_received: number; resolved: number }[];
  agents: {
    user_id: string;
    name: string;
    messages_sent: number;
    resolved: number;
    first_response_median_seconds: number | null;
    open_assigned: number;
  }[];
}

/** 45 → "45s", 150 → "2m 30s", 7380 → "2h 3m", 200000 → "2d 7h"; null → "—". */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d}d ${h % 24}h` : `${d}d`;
}

/** [from, to) for the last `days` calendar days ending today, in the browser's zone. */
export function lastDaysRange(days: number, now = new Date()): { from: Date; to: Date } {
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - days);
  return { from, to };
}
