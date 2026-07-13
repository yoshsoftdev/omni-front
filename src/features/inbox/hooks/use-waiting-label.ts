"use client";

import { useEffect, useState } from "react";

function formatWaitingLabel(waitingSince?: string, now = Date.now()): string {
  if (!waitingSince) return "";
  const start = new Date(waitingSince).getTime();
  if (Number.isNaN(start)) return "";
  const minutes = Math.max(0, Math.floor((now - start) / 60_000));
  if (minutes >= 15) return "15m";
  if (minutes >= 5) return "5m";
  if (minutes >= 2) return "2m";
  if (minutes >= 1) return "1m";
  return "1m";
}

export function useWaitingLabel(waitingSince?: string): string {
  const [label, setLabel] = useState(() => formatWaitingLabel(waitingSince));

  useEffect(() => {
    setLabel(formatWaitingLabel(waitingSince));
    if (!waitingSince) return;
    const timer = window.setInterval(() => {
      setLabel(formatWaitingLabel(waitingSince));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [waitingSince]);

  return label;
}

export { formatWaitingLabel };
