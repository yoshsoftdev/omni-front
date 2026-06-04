"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teamService } from "@/features/team/services/team.service";
import type { TeamRole } from "@/types/team";

interface InviteMemberFormProps {
  onInvited: () => void;
}

export function InviteMemberForm({ onInvited }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("agent");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await teamService.addMember(email, role);
      setEmail("");
      setRole("agent");
      onInvited();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Add member</h2>
        <p className="text-sm text-muted-foreground">
          User must already have an account (registered email).
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="member-email">Email</Label>
          <Input
            id="member-email"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-role">Role</Label>
          <select
            id="member-role"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
          >
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
          </select>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add member"}
      </Button>
    </form>
  );
}
