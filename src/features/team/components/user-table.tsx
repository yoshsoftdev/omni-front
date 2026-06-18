"use client";

import { useState } from "react";
import { Edit3, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/features/team/components/role-badge";
import type { TeamMember } from "@/types/team";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserTable({
  users,
  canManage,
  onDeactivate,
  onRemove,
  onEdit,
  onResendInvite,
}: {
  users: TeamMember[];
  canManage: boolean;
  onDeactivate: (member: TeamMember) => Promise<void>;
  onRemove: (member: TeamMember) => Promise<void>;
  onEdit: (member: TeamMember) => void;
  onResendInvite: (member: TeamMember) => Promise<void>;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  async function runAction(id: string, action: () => Promise<void>) {
    setPendingId(id);
    try {
      await action();
    } finally {
      setPendingId(null);
      setOpenMenuId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="p-4 font-medium">Member</th>
            <th className="p-4 font-medium">Email</th>
            <th className="p-4 font-medium">Role</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Last Active</th>
            {canManage ? <th className="p-4 font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isOwner = user.role === "owner";
            return (
              <tr key={user.id} className="border-b last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {initials(user.name || user.email)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      {user.role === "owner" ? <RoleBadge role="owner" /> : null}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{user.email}</td>
                <td className="p-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="p-4 capitalize">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={[
                        "h-2 w-2 rounded-full",
                        (user.status ?? "active") === "active"
                          ? "bg-emerald-500"
                          : (user.status ?? "active") === "invited"
                            ? "bg-blue-500"
                            : "bg-slate-400",
                      ].join(" ")}
                    />
                    {user.status ?? "active"}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  {(user.status ?? "active") === "invited"
                    ? "*"
                    : user.last_active_at
                      ? new Date(user.last_active_at).toLocaleDateString()
                      : "—"}
                </td>
                {canManage ? (
                  <td className="relative p-4">
                    {!isOwner ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => onEdit(user)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {openMenuId === user.id ? (
                          <div className="absolute right-4 z-10 mt-1 w-40 rounded-md border bg-popover p-1 shadow-md">
                            {(user.status ?? "active") === "invited" ? (
                              <button
                                type="button"
                                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent"
                                onClick={() => runAction(user.id, () => onResendInvite(user))}
                              >
                                Resend Invite
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent"
                              onClick={() => runAction(user.id, () => onDeactivate(user))}
                            >
                              Deactivate
                            </button>
                            <button
                              type="button"
                              className="block w-full rounded px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
                              onClick={() => runAction(user.id, () => onRemove(user))}
                            >
                              Remove
                            </button>
                          </div>
                        ) : null}
                      </>
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
  );
}
