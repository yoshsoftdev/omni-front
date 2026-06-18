"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionMatrix } from "@/features/team/components/permission-matrix";
import { RoleBadge } from "@/features/team/components/role-badge";
import { TeamNav } from "@/features/team/components/team-nav";
import type { PermissionMatrixRow, RoleInfo } from "@/types/rbac";
import type { TeamRole } from "@/types/team";

const ROLE_ORDER: TeamRole[] = ["owner", "admin", "supervisor", "agent"];

const BASE_ROLES: RoleInfo[] = [
  { id: "owner", name: "owner", description: "Full access to all features.", is_system: true },
  { id: "admin", name: "admin", description: "Manage operations and members.", is_system: true },
  { id: "supervisor", name: "supervisor", description: "Monitor team performance.", is_system: true },
  { id: "agent", name: "agent", description: "Handle assigned conversations.", is_system: true },
];

const BASE_MATRIX: PermissionMatrixRow[] = [
  {
    permission: { id: "p1", code: "inbox.view", name: "Inbox & Conversations", description: "View and reply inbox" },
    roles: { owner: true, admin: true, supervisor: true, agent: true },
  },
  {
    permission: { id: "p2", code: "contacts.manage", name: "Contacts", description: "View and manage contacts" },
    roles: { owner: true, admin: true, supervisor: true, agent: false },
  },
  {
    permission: { id: "p3", code: "templates.manage", name: "Templates", description: "Create and manage templates" },
    roles: { owner: true, admin: true, supervisor: false, agent: false },
  },
  {
    permission: { id: "p4", code: "campaign.manage", name: "Broadcast Campaigns", description: "Manage campaigns" },
    roles: { owner: true, admin: true, supervisor: false, agent: false },
  },
  {
    permission: { id: "p5", code: "reports.view", name: "Reports", description: "View performance reports" },
    roles: { owner: true, admin: true, supervisor: true, agent: false },
  },
  {
    permission: { id: "p6", code: "billing.manage", name: "Billing", description: "Manage billing and subscription" },
    roles: { owner: true, admin: false, supervisor: false, agent: false },
  },
];

export function TeamRolesPage() {
  const [roles, setRoles] = useState<RoleInfo[]>(BASE_ROLES);
  const [matrix, setMatrix] = useState<PermissionMatrixRow[]>(BASE_MATRIX);
  const [selectedRole, setSelectedRole] = useState<string>("owner");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const activeRole = roles.find((r) => r.id === selectedRole) ?? null;

  const visibleMatrix = useMemo(() => {
    if (!activeRole) return matrix;
    return matrix.map((row) => ({
      ...row,
      roles: Object.fromEntries(
        Object.entries(row.roles).map(([role, allowed]) => [role, role === activeRole.name ? allowed : false]),
      ),
    }));
  }, [matrix, activeRole]);

  function notify(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2200);
  }

  function openCreate() {
    setNameInput("");
    setDescriptionInput("");
    setCreateOpen(true);
  }

  function openEdit() {
    if (!activeRole) return;
    setNameInput(activeRole.name);
    setDescriptionInput(activeRole.description);
    setEditOpen(true);
  }

  function createRole() {
    const normalizedName = nameInput.trim().toLowerCase();
    if (!normalizedName || !descriptionInput.trim()) {
      return notify("error", "Name and description are required");
    }
    if (roles.some((r) => r.name === normalizedName)) {
      return notify("error", "Role already exists");
    }
    const id = `custom-${Date.now()}`;
    const newRole: RoleInfo = { id, name: normalizedName, description: descriptionInput.trim(), is_system: false };
    setRoles((prev) => [...prev, newRole]);
    setMatrix((prev) =>
      prev.map((row) => ({
        ...row,
        roles: { ...row.roles, [normalizedName]: false },
      })),
    );
    setSelectedRole(id);
    setCreateOpen(false);
    notify("success", "Role created");
  }

  function updateRole() {
    if (!activeRole) return;
    const normalizedName = nameInput.trim().toLowerCase();
    if (!normalizedName || !descriptionInput.trim()) {
      return notify("error", "Name and description are required");
    }
    if (
      roles.some((r) => r.id !== activeRole.id && r.name === normalizedName)
    ) {
      return notify("error", "Role name already used");
    }
    const oldName = activeRole.name;
    setRoles((prev) =>
      prev.map((role) =>
        role.id === activeRole.id ? { ...role, name: normalizedName, description: descriptionInput.trim() } : role,
      ),
    );
    if (oldName !== normalizedName) {
      setMatrix((prev) =>
        prev.map((row) => {
          const oldValue = row.roles[oldName] ?? false;
          const { [oldName]: _removed, ...rest } = row.roles;
          return { ...row, roles: { ...rest, [normalizedName]: oldValue } };
        }),
      );
    }
    setEditOpen(false);
    notify("success", "Role updated");
  }

  function deleteRole() {
    if (!activeRole) return;
    if (activeRole.is_system) {
      return notify("error", "System role cannot be deleted");
    }
    const roleName = activeRole.name;
    setRoles((prev) => prev.filter((r) => r.id !== activeRole.id));
    setMatrix((prev) =>
      prev.map((row) => {
        const { [roleName]: _removed, ...rest } = row.roles;
        return { ...row, roles: rest };
      }),
    );
    setSelectedRole("owner");
    setDeleteOpen(false);
    notify("success", "Role deleted");
  }

  const orderedRoles = [...roles].sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a.name as TeamRole);
    const bi = ROLE_ORDER.indexOf(b.name as TeamRole);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="space-y-6">
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
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
        <p className="text-muted-foreground">System roles and their permission sets.</p>
      </div>

      <TeamNav />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3 rounded-lg border bg-card p-3">
          <Button className="w-full" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
          <div className="space-y-2">
            {orderedRoles.map((role, index) => (
              <button
                key={role.id || `${role.name}-${index}`}
                type="button"
                onClick={() => setSelectedRole(role.id || `${role.name}-${index}`)}
                className={[
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                  selectedRole === (role.id || `${role.name}-${index}`) ? "bg-accent" : "hover:bg-accent/60",
                ].join(" ")}
              >
                <span className="capitalize font-medium">{role.name}</span>
                <RoleBadge role={role.name} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {activeRole ? (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold capitalize">{activeRole.name}</h2>
                  <p className="text-sm text-muted-foreground">{activeRole.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={openEdit}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
              No role selected.
            </div>
          )}
          <PermissionMatrix rows={visibleMatrix} />
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Role</h3>
              <button onClick={() => setCreateOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <Input placeholder="Role Name (e.g. qa)" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
              <Input placeholder="Role Description" value={descriptionInput} onChange={(e) => setDescriptionInput(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createRole}>Create</Button>
            </div>
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Role</h3>
              <button onClick={() => setEditOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <Input placeholder="Role Name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
              <Input placeholder="Role Description" value={descriptionInput} onChange={(e) => setDescriptionInput(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateRole}>Save</Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-card p-5">
            <h3 className="text-base font-semibold">Delete role?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Role <span className="font-medium capitalize">{activeRole?.name}</span> will be removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
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
