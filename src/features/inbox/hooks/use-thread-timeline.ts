import { useMemo } from "react";

import type { InboxActivityEvent, InboxChatMessage } from "@/features/inbox/types";
import { buildThreadTimeline, type TimelineItem } from "@/features/inbox/utils/thread-timeline";

export function useThreadTimeline(
  messages: InboxChatMessage[],
  activities: InboxActivityEvent[],
): TimelineItem[] {
  return useMemo(() => buildThreadTimeline(messages, activities), [messages, activities]);
}
