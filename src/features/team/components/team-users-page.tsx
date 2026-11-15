"use client";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Contact,
  Crown,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCircle2,
  Users,
} from "lucide-react";

import { useConfirm } from "@/components/shared/confirm-dialog";
import { FilterSelect } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { InvitationSuccessDialog } from "@/features/team/components/invitation-success-dialog";
import { InviteUserModal } from "@/features/team/components/invite-user-modal";
import { RoleSelector } from "@/features/team/components/role-selector";
import { UserTable } from "@/features/team/components/user-table";
import { usePermission } from "@/features/team/hooks/use-permission";
import { RoleBadge } from "@/features/team/components/role-badge";
import { teamService } from "@/features/team/services/team.service";
import { formatApiErrorMessage } from "@/services/api/errors";
import {
  buildPermissionPreview,
  mapApiRolesToDefs,
  matrixToPermissionsByRole,
  permissionsByRoleToCodes,
  PERMISSION_ROWS,
  type PermissionRow,
  type RoleDef,
} from "@/features/team/constants/permissions";
import type { TeamInvitation, TeamMember, TeamRole } from "@/types/team";

export function TeamUsersPage() {
  const { can } = usePermission();
  const canManage = can("user.invite");
  const [confirm, confirmDialog] = useConfirm();
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [successInvitation, setSuccessInvitation] = useState<TeamInvitation | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [drawerRole, setDrawerRole] = useState<TeamRole>("agent");
  const [drawerName, setDrawerName] = useState("");
  const [drawerEmail, setDrawerEmail] = useState("");
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [permissionsByRole, setPermissionsByRole] = useState<Record<string, Record<PermissionRow, boolean>>>({});
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roleModal, setRoleModal] = useState<"create" | "edit" | null>(null);
  const [roleNameInput, setRoleNameInput] = useState("");
  const [roleDescInput, setRoleDescInput] = useState("");
  const [deleteRoleOpen, setDeleteRoleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function notify(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2400);
  }

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const rows = await teamService.listUsers();
      setUsers(rows);
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const loadRoles = useCallback(async () => {
    try {
      const [apiRoles, matrix] = await Promise.all([
        teamService.listRoles(),
        teamService.getPermissionMatrix(),
      ]);
      setRoles(mapApiRolesToDefs(apiRoles));
      setPermissionsByRole(matrixToPermissionsByRole(matrix, apiRoles));
      setSelectedRoleId((current) => current || apiRoles[0]?.id || "");
      return apiRoles;
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
      return [];
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0];

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const byRole = roleFilter ? u.role === roleFilter : true;
      const byQuery = q
        ? u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        : true;
      return byRole && byQuery;
    });
  }, [users, search, roleFilter]);

  const pageSize = 5;
  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pagedUsers = filteredUsers.slice(startIndex, endIndex);

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function onRoleFilterChange(value: string) {
    setRoleFilter(value);
    setPage(1);
  }

  function openCreateRole() {
    setRoleNameInput("");
    setRoleDescInput("");
    setRoleModal("create");
  }

  function openEditRole() {
    if (!selectedRole) return;
    setRoleNameInput(selectedRole.title);
    setRoleDescInput(selectedRole.description);
    setRoleModal("edit");
  }

  async function createRole() {
    const title = roleNameInput.trim();
    const description = roleDescInput.trim();
    if (!title || !description) return notify("error", "Role name and description are required");
    const slug = title.toLowerCase().replace(/\s+/g, "-");
    if (roles.some((r) => r.slug === slug)) return notify("error", "Role already exists");
    setSaving(true);
    try {
      const created = await teamService.createRole({ name: slug, description });
      await loadRoles();
      setSelectedRoleId(created.id);
      setRoleModal(null);
      notify("success", "Role created");
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateRole() {
    if (!selectedRole) return;
    const title = roleNameInput.trim();
    const description = roleDescInput.trim();
    if (!title || !description) return notify("error", "Role name and description are required");
    const newSlug = title.toLowerCase().replace(/\s+/g, "-");
    if (roles.some((r) => r.id !== selectedRole.id && r.slug === newSlug)) {
      return notify("error", "Role name already used");
    }
    setSaving(true);
    try {
      await teamService.updateRole(selectedRole.id, {
        name: selectedRole.is_system ? selectedRole.slug : newSlug,
        description,
      });
      await loadRoles();
      setRoleModal(null);
      notify("success", "Role updated");
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRole() {
    if (!selectedRole || selectedRole.is_system) {
      return notify("error", "System role cannot be deleted");
    }
    setSaving(true);
    try {
      await teamService.deleteRole(selectedRole.id);
      const apiRoles = await loadRoles();
      setSelectedRoleId(apiRoles.find((role) => role.name === "owner")?.id ?? "");
      setDeleteRoleOpen(false);
      notify("success", "Role deleted");
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function togglePermission(row: PermissionRow) {
    if (!selectedRole || !canManage || selectedRole.slug === "owner") return;
    const slug = selectedRole.slug;
    const nextPerms = {
      ...(permissionsByRole[slug] ?? {}),
      [row]: !permissionsByRole[slug]?.[row],
    } as Record<PermissionRow, boolean>;
    const nextState = { ...permissionsByRole, [slug]: nextPerms };
    const codes = permissionsByRoleToCodes(nextState, slug);
    setSaving(true);
    try {
      await teamService.updateRolePermissions(selectedRole.id, codes);
      setPermissionsByRole(nextState);
      notify("success", "Permission updated");
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const drawerPermissionPreview = buildPermissionPreview(permissionsByRole, drawerRole);

  return (
    <div className="space-y-7">
      {toast ? (
        <div className="fixed right-6 top-6 z-[80]">
          <div
            className={[
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-lg",
              toast.type === "success" ? "border-success-border bg-success-muted text-success-foreground" : "border-error-border bg-error-muted text-error-foreground",
            ].join(" ")}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {toast.message}
          </div>
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">Manage your team members and workspace settings.</p>
      </div>

      <div className="flex items-center gap-6 border-b">
        <span className="border-b-2 border-primary pb-3 text-sm font-medium text-foreground">
          Members
        </span>
        <Link href="/team/workspace" className="pb-3 text-sm text-muted-foreground hover:text-foreground">
          Workspace
        </Link>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Team Members</h2>
            <p className="text-sm text-muted-foreground">
              Invite, manage, and control access for your team.
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-3 sm:max-w-2xl sm:flex-row sm:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <FilterSelect
              label="Filter by role"
              value={roleFilter}
              onChange={onRoleFilterChange}
              options={[{ value: "", label: "All Roles" }, ...roles.map((role) => ({ value: role.slug, label: role.title }))]}
              className="capitalize"
            />
            {canManage ? (
              <Button onClick={() => setInviteOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          {filteredUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">No members match your search/filter.</p>
            </div>
          ) : (
            <>
              <UserTable
                users={pagedUsers}
                canManage={canManage}
                onEdit={(member) => {
                  setEditingMember(member);
                  setDrawerRole(member.role);
                  setDrawerName(member.name);
                  setDrawerEmail(member.email);
                }}
                onResendInvite={async (member) => {
                  try {
                    const invitation = await teamService.inviteUser({
                      name: member.name,
                      email: member.email,
                      role: member.role,
                    });
                    setSuccessInvitation(invitation);
                    notify("success", `Invitation resent to ${member.email}`);
                  } catch (err) {
                    notify("error", formatApiErrorMessage(err));
                  }
                }}
                onDeactivate={async (member) => {
                  setEditingMember(member);
                  setConfirmDeactivateOpen(true);
                }}
                onRemove={async (member) => {
                  const ok = await confirm({
                    title: "Remove member?",
                    description: `${member.name} loses access to this workspace.`,
                    confirmLabel: "Remove",
                  });
                  if (!ok) return;
                  try {
                    await teamService.removeUser(member.id);
                    await loadUsers();
                    notify("success", `${member.name} removed`);
                  } catch (err) {
                    notify("error", formatApiErrorMessage(err));
                  }
                }}
              />
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {total === 0 ? 0 : startIndex + 1} to {endIndex} of {total} members
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="h-8 rounded border px-2 disabled:opacity-50"
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const p = idx + 1;
                    return (
                      <button
                        key={p}
                        className={[
                          "h-8 w-8 rounded border",
                          p === currentPage ? "bg-primary text-primary-foreground" : "",
                        ].join(" ")}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    className="h-8 rounded border px-2 disabled:opacity-50"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">About Roles</h3>
              <p className="mt-1 text-sm text-muted-foreground">Each role has different access levels.</p>
            </div>
            {canManage ? (
              <Button size="sm" onClick={openCreateRole}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Role
              </Button>
            ) : null}
          </div>
          <div className="mt-4 space-y-3">
            {roles.map((item) => {
              const Icon =
                item.slug === "owner"
                  ? Crown
                  : item.slug === "admin"
                    ? Shield
                    : item.slug === "supervisor"
                      ? Users
                      : MessageSquareText;
              const selected = selectedRoleId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedRoleId(item.id)}
                  className={[
                    "w-full rounded-lg border bg-background p-3 text-left",
                    selected ? "border-primary ring-1 ring-primary/30" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <RoleBadge role={item.slug} />
                    <span className="text-sm font-medium">{item.title}</span>
                    {!item.is_system ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Custom</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                  {item.bullets.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.bullets.map((b) => (
                        <span key={b} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {b}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">
                Permission Overview
                {canManage ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(Editable)</span>
                ) : (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(Read-only)</span>
                )}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {canManage
                  ? "Select a role, then click permissions to toggle access."
                  : "Click a role in the list to see full permission details."}
              </p>
            </div>
            {canManage && selectedRole ? (
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" onClick={openEditRole}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit Role
                </Button>
                {!selectedRole.is_system ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-error-border text-error-foreground"
                    onClick={() => setDeleteRoleOpen(true)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          <DataTable className="mt-4">
              <DataTableHead>
                <DataTableRow>
                  <DataTableHeaderCell>Permission</DataTableHeaderCell>
                  {roles.map((role) => (
                    <DataTableHeaderCell
                      key={role.id}
                      className={selectedRoleId === role.id ? "bg-primary/5 text-center capitalize" : "text-center capitalize"}
                    >
                      {role.title}
                    </DataTableHeaderCell>
                  ))}
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {PERMISSION_ROWS.map((rowName) => (
                  <DataTableRow key={rowName}>
                    <DataTableCell>{rowName}</DataTableCell>
                    {roles.map((role) => {
                      const allowed = permissionsByRole[role.slug]?.[rowName] ?? false;
                      const isSelectedCol = selectedRoleId === role.id;
                      return (
                        <DataTableCell
                          key={`${rowName}-${role.id}`}
                          className={isSelectedCol ? "bg-primary/5 text-center" : "text-center"}
                        >
                          {canManage && isSelectedCol ? (
                            <button
                              type="button"
                              onClick={() => togglePermission(rowName)}
                              aria-label={`${rowName} for ${role.title}`}
                              aria-pressed={allowed}
                              className={[
                                "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                                allowed
                                  ? "border-success-border bg-success-muted text-success-foreground"
                                  : "border-muted bg-background text-muted-foreground",
                              ].join(" ")}
                            >
                              {allowed ? "✓" : "—"}
                            </button>
                          ) : (
                            <span className={allowed ? "text-success-foreground" : "text-muted-foreground"}>
                              {allowed ? "✓" : "—"}
                            </span>
                          )}
                        </DataTableCell>
                      );
                    })}
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
        </div>
      </section>

      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => void loadUsers()}
        onSubmit={async (input) => {
          const invitation = await teamService.inviteUser(input);
          setSuccessInvitation(invitation);
          await loadUsers();
          setPage(1);
          notify("success", "Invitation sent successfully");
        }}
      />

      {successInvitation ? (
        <InvitationSuccessDialog
          invitation={successInvitation}
          onClose={() => setSuccessInvitation(null)}
        />
      ) : null}

      {editingMember ? (
        <Sheet open onOpenChange={(next) => !next && setEditingMember(null)}>
          <SheetContent className="overflow-y-auto p-5" hideClose={false} aria-describedby={undefined}>
            <div className="mb-4 flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold">Edit Member</SheetTitle>
            </div>
            <div className="mb-4 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">{editingMember.name}</div>
                  <div className="text-xs text-muted-foreground">{editingMember.email}</div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success-muted px-2 py-0.5 text-xs text-success-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Active
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Full Name</label>
                <Input value={drawerName} onChange={(e) => setDrawerName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Email</label>
                <Input value={drawerEmail} onChange={(e) => setDrawerEmail(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Role</label>
                <RoleSelector value={drawerRole} onChange={setDrawerRole} includeOwner />
              </div>
            </div>

            <div className="mt-5 rounded-lg border p-3">
              <div className="text-sm font-medium">Permissions Preview</div>
              <p className="mb-3 text-xs text-muted-foreground">
                This is a preview of what this role can access.
              </p>
              <div className="space-y-2 text-sm">
                {drawerPermissionPreview.map((label) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      {label.includes("Inbox") ? (
                        <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                      ) : label.includes("Contacts") ? (
                        <Contact className="h-4 w-4 text-muted-foreground" />
                      ) : label.includes("Templates") ? (
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                      )}
                      {label}
                    </span>
                    <span className="text-success-foreground">●</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                onClick={async () => {
                  if (!editingMember) return;
                  try {
                    await teamService.updateUserRole(editingMember.id, drawerRole);
                    await loadUsers();
                    setEditingMember(null);
                    notify("success", "Member updated");
                  } catch (err) {
                    notify("error", formatApiErrorMessage(err));
                  }
                }}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="w-full border-error-border text-error-foreground"
                onClick={() => setConfirmDeactivateOpen(true)}
              >
                Deactivate Member
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      {confirmDeactivateOpen && editingMember ? (
        <Dialog open onOpenChange={(next) => !next && setConfirmDeactivateOpen(false)}>
          <DialogContent className="max-w-sm" aria-describedby={undefined}>
            <DialogTitle>Deactivate this member?</DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {editingMember.name} will lose access until reactivated.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDeactivateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editingMember) return;
                  try {
                    await teamService.deactivateUser(editingMember.id);
                    await loadUsers();
                    setConfirmDeactivateOpen(false);
                    setEditingMember(null);
                    notify("success", "Member deactivated");
                  } catch (err) {
                    notify("error", formatApiErrorMessage(err));
                  }
                }}
              >
                Deactivate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {roleModal ? (
        <Dialog open onOpenChange={(next) => !next && setRoleModal(null)}>
          <DialogContent className="max-w-md" aria-describedby={undefined}>
            <div className="mb-4 flex items-center justify-between">
              <DialogTitle>{roleModal === "create" ? "Create Role" : "Edit Role"}</DialogTitle>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Role Name</label>
                <Input
                  value={roleNameInput}
                  onChange={(e) => setRoleNameInput(e.target.value)}
                  placeholder="e.g. QA Lead"
                />
                {roleModal === "edit" && selectedRole?.is_system ? (
                  <p className="mt-1 text-xs text-muted-foreground">System role identifier stays the same; display name will update.</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-sm">Description</label>
                <Input
                  value={roleDescInput}
                  onChange={(e) => setRoleDescInput(e.target.value)}
                  placeholder="What can this role do?"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRoleModal(null)}>
                Cancel
              </Button>
              <Button onClick={roleModal === "create" ? createRole : updateRole}>
                {roleModal === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {deleteRoleOpen && selectedRole ? (
        <Dialog open onOpenChange={(next) => !next && setDeleteRoleOpen(false)}>
          <DialogContent className="max-w-sm" aria-describedby={undefined}>
            <DialogTitle>Delete role?</DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Role <span className="font-medium">{selectedRole.title}</span> will be permanently removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteRoleOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-error hover:bg-error/90" onClick={deleteRole}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
      {confirmDialog}
    </div>
  );
}
