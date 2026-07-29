"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { ContactAvatar } from "@/components/shared/contact-avatar";
import { Button } from "@/components/ui/button";
import type { InboxAgent } from "@/features/inbox/types";
import { cn } from "@/lib/utils";

const PRESENCE_STYLES = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  offline: "bg-slate-400",
};

interface AssignConversationModalProps {
  open: boolean;
  agents: InboxAgent[];
  selectedAgentId?: string;
  enableAutomationAgent?: boolean;
  onClose: () => void;
  onAssign: (agentId: string) => void;
}

export const AUTOMATION_AGENT_PICK_ID = "__automation_agent__";

export function AssignConversationModal({
  open,
  agents,
  selectedAgentId,
  enableAutomationAgent = false,
  onClose,
  onAssign,
}: AssignConversationModalProps) {
  const [search, setSearch] = useState("");
  const [pickedId, setPickedId] = useState(selectedAgentId ?? "");

  const filtered = useMemo(
    () =>
      agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(search.toLowerCase()) ||
          agent.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [agents, search],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Assign Conversation</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agent..."
              className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm"
            />
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto">
            {enableAutomationAgent ? (
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-accent/50",
                  pickedId === AUTOMATION_AGENT_PICK_ID && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  name="agent"
                  value={AUTOMATION_AGENT_PICK_ID}
                  checked={pickedId === AUTOMATION_AGENT_PICK_ID}
                  onChange={() => setPickedId(AUTOMATION_AGENT_PICK_ID)}
                  className="accent-primary"
                />
                <ContactAvatar name="Automation Agent" size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">Automation Agent</p>
                  <div className="text-xs text-muted-foreground">Webhook automation handler</div>
                </div>
              </label>
            ) : null}
            {filtered.map((agent) => (
              <label
                key={agent.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-accent/50",
                  pickedId === agent.id && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  name="agent"
                  value={agent.id}
                  checked={pickedId === agent.id}
                  onChange={() => setPickedId(agent.id)}
                  className="accent-primary"
                />
                <ContactAvatar name={agent.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{agent.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", PRESENCE_STYLES[agent.presence])} />
                    {agent.presence.charAt(0).toUpperCase() + agent.presence.slice(1)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!pickedId} onClick={() => onAssign(pickedId)}>
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}
