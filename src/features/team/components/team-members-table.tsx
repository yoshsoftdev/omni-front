"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { teamService } from "@/features/team/services/team.service";
import { useAuthStore } from "@/store/auth-store";
import type { TeamMember, TeamRole } from "@/types/team";

interface TeamMembersTableProps {
  members: TeamMember[];
  onChanged: () => void;
}

export function TeamMembersTable({ members, onChanged }: TeamMembersTableProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(member: TeamMember, newRole: TeamRole) {
    setError(null);
    setPendingId(member.id);
    try {
      await teamService.updateMemberRole(member.id, newRole);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setPendingId(null);
    }
  }

  async function handleRemove(member: TeamMember) {
    if (!confirm(`Remove ${member.name} from the team?`)) return;

    setError(null);
    setPendingId(member.id);
    try {
      await teamService.removeMember(member.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">{members.length} people in this workspace</p>
      </div>
      {error ? <p className="px-4 pt-4 text-sm text-destructive">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
              {canManage ? <th className="p-4 font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isOwner = member.role === "owner";
              const isSelf = member.user_id === currentUserId;

              return (
                <tr key={member.id} className="border-b last:border-0">
                  <td className="p-4 font-medium">{member.name}</td>
                  <td className="p-4 text-muted-foreground">{member.email}</td>
                  <td className="p-4">
                    {canManage && !isOwner ? (
                      <select
                        className="rounded-md border border-input bg-background px-2 py-1"
                        value={member.role}
                        disabled={pendingId === member.id}
                        onChange={(e) => handleRoleChange(member, e.target.value as TeamRole)}
                      >
                        <option value="admin">Admin</option>
                        <option value="agent">Agent</option>
                      </select>
                    ) : (
                      <span className="capitalize">{member.role}</span>
                    )}
                  </td>
                  {canManage ? (
                    <td className="p-4">
                      {!isOwner && !isSelf ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pendingId === member.id}
                          onClick={() => handleRemove(member)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
