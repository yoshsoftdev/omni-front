"use client";

import { useCallback, useEffect, useState } from "react";

import { InviteMemberForm } from "@/features/team/components/invite-member-form";
import { TeamMembersTable } from "@/features/team/components/team-members-table";
import { TeamSettingsForm } from "@/features/team/components/team-settings-form";
import { teamService } from "@/features/team/services/team.service";
import { useAuthStore } from "@/store/auth-store";
import type { TeamMember } from "@/types/team";

export function TeamPage() {
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setError(null);
    try {
      const data = await teamService.listMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-muted-foreground">Manage workspace settings and members.</p>
      </div>

      <TeamSettingsForm />

      {canManage ? <InviteMemberForm onInvited={loadMembers} /> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading members...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <TeamMembersTable members={members} onChanged={loadMembers} />
      )}
    </div>
  );
}
