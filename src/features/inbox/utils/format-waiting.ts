/**
 * Relative waiting duration for queue/list UI.
 * Returns empty string when waitingSince is missing/invalid.
 */
export function formatWaitingLabel(waitingSince?: string, now = Date.now()): string {
  if (!waitingSince) return "";
  const start = new Date(waitingSince).getTime();
  if (Number.isNaN(start)) return "";

  const totalSeconds = Math.max(0, Math.floor((now - start) / 1000));
  if (totalSeconds < 60) return "<1m";

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/** Compact clock-style wait for headers (HH:MM or Dd HH:MM). */
export function formatWaitingClock(waitingSince?: string, now = Date.now()): string {
  if (!waitingSince) return "";
  const start = new Date(waitingSince).getTime();
  if (Number.isNaN(start)) return "";

  const totalSeconds = Math.max(0, Math.floor((now - start) / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
