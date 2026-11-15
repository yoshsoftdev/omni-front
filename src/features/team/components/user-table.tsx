"use client";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { useState } from "react";
import { Copy, Edit3, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/features/team/components/role-badge";
import { buildInviteUrl } from "@/features/team/mappers/team.mapper";
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyInviteLink(member: TeamMember) {
    try {
      await navigator.clipboard.writeText(buildInviteUrl(member.id));
      setCopiedId(member.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  async function runAction(id: string, action: () => Promise<void>) {
    setPendingId(id);
    try {
      await action();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <DataTable className="rounded-lg border bg-card">
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Member</DataTableHeaderCell>
            <DataTableHeaderCell>Email</DataTableHeaderCell>
            <DataTableHeaderCell>Role</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
            <DataTableHeaderCell>Last Active</DataTableHeaderCell>
            {canManage ? <DataTableHeaderCell>Actions</DataTableHeaderCell> : null}
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          {users.map((user) => {
            const isOwner = user.role === "owner";
            return (
              <DataTableRow key={user.id}>
                <DataTableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {initials(user.name || user.email)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      {user.role === "owner" ? <RoleBadge role="owner" /> : null}
                    </div>
                  </div>
                </DataTableCell>
                <DataTableCell className="text-muted-foreground">{user.email}</DataTableCell>
                <DataTableCell>
                  <RoleBadge role={user.role} />
                </DataTableCell>
                <DataTableCell className="capitalize">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={[
                        "h-2 w-2 rounded-full",
                        (user.status ?? "active") === "active"
                          ? "bg-success"
                          : (user.status ?? "active") === "invited"
                            ? "bg-info"
                            : "bg-slate-400",
                      ].join(" ")}
                    />
                    {user.status ?? "active"}
                  </span>
                </DataTableCell>
                <DataTableCell className="text-muted-foreground">
                  {(user.status ?? "active") === "invited"
                    ? "*"
                    : user.last_active_at
                      ? new Date(user.last_active_at).toLocaleDateString()
                      : "—"}
                </DataTableCell>
                {canManage ? (
                  <DataTableCell className="relative">
                    {!isOwner ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          aria-label={`Edit ${user.name}`}
                          onClick={() => onEdit(user)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" aria-label={`More actions for ${user.name}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {(user.status ?? "active") === "invited" ? (
                              <>
                                <DropdownMenuItem onSelect={() => void copyInviteLink(user)}>
                                  <Copy />
                                  {copiedId === user.id ? "Copied" : "Copy Invite Link"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={pendingId === user.id}
                                  onSelect={() => runAction(user.id, () => onResendInvite(user))}
                                >
                                  Resend Invite
                                </DropdownMenuItem>
                              </>
                            ) : null}
                            <DropdownMenuItem onSelect={() => runAction(user.id, () => onDeactivate(user))}>
                              Deactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem destructive onSelect={() => runAction(user.id, () => onRemove(user))}>
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </DataTableCell>
                ) : null}
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>
  );
}
