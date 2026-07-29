"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ALL_CHANNELS = "all";

function readParam(params: URLSearchParams, key: string): string | null {
  const value = params.get(key)?.trim();
  return value ? value : null;
}

/**
 * URL-backed inbox selection:
 * - `channel` → channel account id (omit / "all" = All Inbox)
 * - `c` → selected conversation id
 * - `contact` → legacy deep-link (resolved by InboxPage)
 */
export function useInboxSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const channelId = useMemo(() => {
    const value = readParam(searchParams, "channel");
    return value ?? ALL_CHANNELS;
  }, [searchParams]);

  const selectedId = useMemo(() => readParam(searchParams, "c"), [searchParams]);
  const contactParam = useMemo(() => readParam(searchParams, "contact"), [searchParams]);

  const replaceParams = useCallback(
    (patch: { channel?: string | null; c?: string | null; contact?: string | null }) => {
      const next = new URLSearchParams(searchParams.toString());

      if (patch.channel !== undefined) {
        if (!patch.channel || patch.channel === ALL_CHANNELS) {
          next.delete("channel");
        } else {
          next.set("channel", patch.channel);
        }
      }

      if (patch.c !== undefined) {
        if (!patch.c) next.delete("c");
        else next.set("c", patch.c);
      }

      if (patch.contact !== undefined) {
        if (!patch.contact) next.delete("contact");
        else next.set("contact", patch.contact);
      }

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setChannelId = useCallback(
    (nextChannelId: string) => {
      // Switching channel accounts clears the open conversation to avoid
      // showing a thread that is outside the active filter.
      replaceParams({ channel: nextChannelId, c: null });
    },
    [replaceParams],
  );

  const setSelectedId = useCallback(
    (conversationId: string | null) => {
      replaceParams({ c: conversationId });
    },
    [replaceParams],
  );

  return {
    channelId,
    selectedId,
    contactParam,
    setChannelId,
    setSelectedId,
    replaceParams,
  };
}
