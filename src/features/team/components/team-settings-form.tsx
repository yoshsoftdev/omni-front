"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teamService } from "@/features/team/services/team.service";
import { useAuthStore } from "@/store/auth-store";

export function TeamSettingsForm() {
  const team = useAuthStore((state) => state.team);
  const role = useAuthStore((state) => state.role);
  const [name, setName] = useState(team?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canManage = role === "owner" || role === "admin";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;

    setError(null);
    setLoading(true);
    try {
      await teamService.updateTeam(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update team");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Workspace</h2>
        <p className="text-sm text-muted-foreground">Update your team display name.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-name">Team name</Label>
        <Input
          id="team-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canManage}
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {canManage ? (
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">Only owners and admins can edit workspace settings.</p>
      )}
    </form>
  );
}
