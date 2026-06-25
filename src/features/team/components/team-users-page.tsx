"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InviteUserModal } from "@/features/team/components/invite-user-modal";
import { RoleSelector } from "@/features/team/components/role-selector";
import { UserTable } from "@/features/team/components/user-table";
import { usePermission } from "@/features/team/hooks/use-permission";
import { RoleBadge } from "@/features/team/components/role-badge";
import { teamService } from "@/features/team/services/team.service";
import {
  buildPermissionPreview,
  INITIAL_ROLES,
  PERMISSION_BY_ROLE,
  PERMISSION_ROWS,
  type MockRoleDef,
  type PermissionRow,
} from "@/features/team/mock-data";
import type { TeamMember, TeamRole, MemberStatus } from "@/types/team";

export function TeamUsersPage() {
  const { can } = usePermission();
  const canManage = can("user.invite");
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [drawerRole, setDrawerRole] = useState<TeamRole>("agent");
  const [drawerName, setDrawerName] = useState("");
  const [drawerEmail, setDrawerEmail] = useState("");
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [roles, setRoles] = useState<MockRoleDef[]>(INITIAL_ROLES);
  const [permissionsByRole, setPermissionsByRole] = useState<Record<string, Record<PermissionRow, boolean>>>(
    () => structuredClone(PERMISSION_BY_ROLE),
  );
  const [selectedRoleId, setSelectedRoleId] = useState("owner");
  const [roleModal, setRoleModal] = useState<"create" | "edit" | null>(null);
  const [roleNameInput, setRoleNameInput] = useState("");
  const [roleDescInput, setRoleDescInput] = useState("");
  const [deleteRoleOpen, setDeleteRoleOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    teamService
      .listUsers()
      .then(setUsers)
      .catch(() => notify("error", "Failed to load team users"))
      .finally(() => setUsersLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function notify(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2400);
  }

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

  function createRole() {
    const title = roleNameInput.trim();
    const description = roleDescInput.trim();
    if (!title || !description) return notify("error", "Role name and description are required");
    const slug = title.toLowerCase().replace(/\s+/g, "-");
    if (roles.some((r) => r.slug === slug)) return notify("error", "Role already exists");
    const id = `role-${Date.now()}`;
    const newRole: MockRoleDef = {
      id,
      slug,
      title,
      description,
      bullets: [],
      is_system: false,
    };
    setRoles((prev) => [...prev, newRole]);
    setPermissionsByRole((prev) => ({
      ...prev,
      [slug]: Object.fromEntries(PERMISSION_ROWS.map((row) => [row, false])) as Record<PermissionRow, boolean>,
    }));
    setSelectedRoleId(id);
    setRoleModal(null);
    notify("success", "Role created");
  }

  function updateRole() {
    if (!selectedRole) return;
    const title = roleNameInput.trim();
    const description = roleDescInput.trim();
    if (!title || !description) return notify("error", "Role name and description are required");
    const newSlug = title.toLowerCase().replace(/\s+/g, "-");
    if (roles.some((r) => r.id !== selectedRole.id && r.slug === newSlug)) {
      return notify("error", "Role name already used");
    }
    const oldSlug = selectedRole.slug;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRole.id ? { ...r, title, description, slug: selectedRole.is_system ? r.slug : newSlug } : r,
      ),
    );
    if (!selectedRole.is_system && oldSlug !== newSlug) {
      setPermissionsByRole((prev) => {
        const { [oldSlug]: perms, ...rest } = prev;
        return { ...rest, [newSlug]: perms ?? {} as Record<PermissionRow, boolean> };
      });
    }
    setRoleModal(null);
    notify("success", "Role updated");
  }

  function deleteRole() {
    if (!selectedRole || selectedRole.is_system) {
      return notify("error", "System role cannot be deleted");
    }
    const slug = selectedRole.slug;
    setRoles((prev) => prev.filter((r) => r.id !== selectedRole.id));
    setPermissionsByRole((prev) => {
      const { [slug]: _removed, ...rest } = prev;
      return rest;
    });
    setSelectedRoleId("owner");
    setDeleteRoleOpen(false);
    notify("success", "Role deleted");
  }

  function togglePermission(row: PermissionRow) {
    if (!selectedRole || !canManage) return;
    const slug = selectedRole.slug;
    setPermissionsByRole((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], [row]: !prev[slug]?.[row] },
    }));
  }

  const drawerPermissionPreview = buildPermissionPreview(permissionsByRole, drawerRole);

  return (
    <div className="space-y-7">
      {toast ? (
        <div className="fixed right-6 top-6 z-[60]">
          <div
            className={[
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-lg",
              toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700",
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
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm capitalize"
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.slug}>
                  {role.title}
                </option>
              ))}
            </select>
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
                  notify("success", `Invitation resent to ${member.email}`);
                }}
                onDeactivate={async (member) => {
                  setEditingMember(member);
                  setConfirmDeactivateOpen(true);
                }}
                onRemove={async (member) => {
                  if (!confirm(`Remove ${member.name} from the workspace?`)) return;
                  setUsers((prev) => prev.filter((u) => u.id !== member.id));
                  notify("success", `${member.name} removed`);
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
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Custom</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                  {item.bullets.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.bullets.map((b) => (
                        <span key={b} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
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
                    className="border-red-200 text-red-600"
                    onClick={() => setDeleteRoleOpen(true)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Permission</th>
                  {roles.map((role) => (
                    <th
                      key={role.id}
                      className={[
                        "p-3 text-center font-medium capitalize",
                        selectedRoleId === role.id ? "bg-primary/5" : "",
                      ].join(" ")}
                    >
                      {role.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_ROWS.map((rowName) => (
                  <tr key={rowName} className="border-b last:border-0">
                    <td className="p-3">{rowName}</td>
                    {roles.map((role) => {
                      const allowed = permissionsByRole[role.slug]?.[rowName] ?? false;
                      const isSelectedCol = selectedRoleId === role.id;
                      return (
                        <td
                          key={`${rowName}-${role.id}`}
                          className={["p-3 text-center", isSelectedCol ? "bg-primary/5" : ""].join(" ")}
                        >
                          {canManage && isSelectedCol ? (
                            <button
                              type="button"
                              onClick={() => togglePermission(rowName)}
                              className={[
                                "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                                allowed
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : "border-muted bg-background text-muted-foreground",
                              ].join(" ")}
                            >
                              {allowed ? "✓" : "—"}
                            </button>
                          ) : (
                            <span className={allowed ? "text-emerald-600" : "text-muted-foreground"}>
                              {allowed ? "✓" : "—"}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => {}}
        onSubmit={async (input) => {
          const now = new Date().toISOString();
          const newMember: TeamMember = {
            id: String(Date.now()),
            user_id: `u-${Date.now()}`,
            name: input.name,
            email: input.email,
            role: input.role,
            status: "invited",
            created_at: now,
          };
          setUsers((prev) => [newMember, ...prev]);
          setPage(1);
          notify("success", "Invitation sent successfully");
        }}
      />

      {editingMember ? (
        <div className="fixed inset-0 z-50 bg-black/30">
          <div className="absolute right-0 top-0 h-full w-full max-w-[420px] border-l bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Member</h3>
              <button onClick={() => setEditingMember(null)}>
                <X className="h-4 w-4" />
              </button>
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
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
                    <span className="text-emerald-600">●</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  setUsers((prev) =>
                    prev.map((u) =>
                      u.id === editingMember.id ? { ...u, name: drawerName, email: drawerEmail, role: drawerRole } : u,
                    ),
                  );
                  setEditingMember(null);
                  notify("success", "Member updated");
                }}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600"
                onClick={() => setConfirmDeactivateOpen(true)}
              >
                Deactivate Member
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeactivateOpen && editingMember ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-card p-5">
            <h4 className="text-base font-semibold">Deactivate this member?</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {editingMember.name} will lose access until reactivated.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDeactivateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setUsers((prev) =>
                    prev.map((u) => (u.id === editingMember.id ? { ...u, status: "inactive" as MemberStatus } : u)),
                  );
                  setConfirmDeactivateOpen(false);
                  setEditingMember(null);
                  notify("success", "Member deactivated");
                }}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {roleModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{roleModal === "create" ? "Create Role" : "Edit Role"}</h3>
              <button onClick={() => setRoleModal(null)}>
                <X className="h-4 w-4" />
              </button>
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
          </div>
        </div>
      ) : null}

      {deleteRoleOpen && selectedRole ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-card p-5">
            <h4 className="text-base font-semibold">Delete role?</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Role <span className="font-medium">{selectedRole.title}</span> will be permanently removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteRoleOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={deleteRole}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
