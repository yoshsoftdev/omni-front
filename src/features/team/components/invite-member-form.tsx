"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelector } from "@/features/team/components/role-selector";
import { teamService } from "@/features/team/services/team.service";
import { formatApiErrorMessage } from "@/services/api/errors";
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
      await teamService.addMember(email.trim(), role);
      setEmail("");
      setRole("agent");
      onInvited();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-lg border bg-card p-4">
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
          <RoleSelector value={role} onChange={setRole} />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add member"}
      </Button>
    </form>
  );
}
