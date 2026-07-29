"use client";

import { useEffect, useState } from "react";

import { formatWaitingClock, formatWaitingLabel } from "@/features/inbox/utils/format-waiting";

export function useWaitingLabel(waitingSince?: string): string {
  const [label, setLabel] = useState(() => formatWaitingLabel(waitingSince));

  useEffect(() => {
    setLabel(formatWaitingLabel(waitingSince));
    if (!waitingSince) return;
    const timer = window.setInterval(() => {
      setLabel(formatWaitingLabel(waitingSince));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [waitingSince]);

  return label;
}

/** Live HH:MM:SS (or Dd HH:MM) waiting clock for the conversation header. */
export function useWaitingClock(waitingSince?: string): string {
  const [label, setLabel] = useState(() => formatWaitingClock(waitingSince));

  useEffect(() => {
    setLabel(formatWaitingClock(waitingSince));
    if (!waitingSince) return;
    const timer = window.setInterval(() => {
      setLabel(formatWaitingClock(waitingSince));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [waitingSince]);

  return label;
}

export { formatWaitingLabel, formatWaitingClock } from "@/features/inbox/utils/format-waiting";
