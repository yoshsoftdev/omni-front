"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { inboxAgentsQueryKey } from "@/features/inbox/query-keys";
import type { InboxAgent } from "@/features/inbox/types";
import { teamService } from "@/features/team/services/team.service";

const EMPTY_AGENTS: InboxAgent[] = [];

/** Workspace member directory used for assignee names and the assign modal. */
export function useInboxAgents() {
  const query = useQuery({
    queryKey: inboxAgentsQueryKey,
    queryFn: async (): Promise<InboxAgent[]> => {
      const members = await teamService.listMembers();
      return members.map((member) => ({
        id: member.user_id,
        name: member.name,
        email: member.email,
        presence: member.status === "active" ? "online" : "offline",
      }));
    },
    staleTime: 5 * 60_000,
  });

  const agents = useMemo(() => query.data ?? EMPTY_AGENTS, [query.data]);

  const agentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agents) {
      if (agent.id && agent.name) map.set(agent.id, agent.name);
    }
    return map;
  }, [agents]);

  return { agents, agentNameById, loading: query.isLoading };
}
