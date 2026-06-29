"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleBadge } from "@/features/team/components/role-badge";
import { invitationService } from "@/features/team/services/invitation.service";
import { formatApiErrorMessage } from "@/services/api/errors";
import type { InvitationPreview } from "@/types/team";

export function InviteAcceptPage({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let active = true;
    void invitationService
      .getInvitation(invitationId)
      .then((data) => {
        if (!active) return;
        setInvitation(data);
        setName(data.name ?? "");
      })
      .catch((err) => {
        if (!active) return;
        setError(formatApiErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [invitationId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitation) return;
    setError(null);
    setSubmitting(true);
    try {
      await invitationService.acceptInvitation(invitationId, {
        name: name.trim() || undefined,
        password,
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading invitation...</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Invitation unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "This invitation link is invalid or has expired."}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6 space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Join {invitation.team_name}</h1>
          <p className="text-sm text-muted-foreground">
            You were invited as <RoleBadge role={invitation.role} /> to collaborate in this workspace.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" type="email" value={invitation.email} readOnly disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-name">Full Name</Label>
          <Input
            id="invite-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-password">Password</Label>
          <Input
            id="invite-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">
            Use your existing password if you already have an account with this email.
          </p>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Joining workspace..." : "Accept invitation"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already signed in elsewhere?{" "}
        <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
