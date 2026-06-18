"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  FileText,
  Globe,
  Link2,
  Lock,
  Megaphone,
  MessageCircle,
  Shield,
  Trash2,
  UserCog,
  Users,
  WandSparkles,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_TEAM_MEMBERS, MOCK_WORKSPACE, MOCK_WORKSPACE_ACTIVITY } from "@/features/team/mock-data";

export function TeamWorkspacePage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState(MOCK_WORKSPACE);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [draftName, setDraftName] = useState(workspace.name);
  const [draftTimezone, setDraftTimezone] = useState(workspace.timezone);
  const [draftCountry, setDraftCountry] = useState(workspace.country);
  const [transferOwnerId, setTransferOwnerId] = useState(workspace.ownerId);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function notify(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2400);
  }

  function onUsageAction(action: string) {
    if (action === "Manage Users") return router.push("/team/users");
    if (action === "Manage Numbers") return notify("success", "WhatsApp Numbers page coming soon.");
    if (action === "View Contacts") return router.push("/contacts");
    if (action === "View Campaigns") return router.push("/broadcast/campaign");
    if (action === "View Templates") return router.push("/broadcast/templates");
  }

  return (
    <div className="space-y-8">
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
        <Link href="/team/users" className="pb-3 text-sm text-muted-foreground hover:text-foreground">
          Members
        </Link>
        <span className="border-b-2 border-primary pb-3 text-sm font-medium text-foreground">
          Workspace
        </span>
      </div>

      <div className="space-y-6">
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Workspace Information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              General information about your workspace.
            </p>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-4 sm:col-span-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Workspace Name</div>
                    <div className="text-lg font-semibold">{workspace.name}</div>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => setEditOpen(true)}>
                    Edit
                  </Button>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Workspace Slug</div>
                  <div className="mt-1 font-medium">{workspace.slug}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Timezone</div>
                  <div className="mt-1 font-medium">{workspace.timezone}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Country</div>
                  <div className="mt-1 font-medium">{workspace.country}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Owner</div>
                  <div className="mt-1 font-medium">{workspace.ownerName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created At</div>
                  <div className="mt-1 font-medium">{workspace.createdAt}</div>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      {workspace.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      {workspace.plan}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Renewal Date</span>
                    <span className="text-sm font-medium">{workspace.renewalDate}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => notify("success", "Billing page coming soon")}
                >
                  Manage Billing
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Workspace Usage</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your current usage and limits. Usage will reset on the next billing cycle.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                { title: "Users", value: "6 / 20", pct: 30, action: "Manage Users", icon: Users },
                { title: "WhatsApp Numbers", value: "3 / 10", pct: 30, action: "Manage Numbers", icon: MessageCircle },
                { title: "Contacts", value: "25,430 / 100,000", pct: 25, action: "View Contacts", icon: UserCog },
                { title: "Active Campaigns", value: "8 / 50", pct: 16, action: "View Campaigns", icon: Megaphone },
                { title: "Templates", value: "18 / 250", pct: 7, action: "View Templates", icon: FileText },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border bg-background p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <item.icon className="h-4 w-4" />
                    <span className="text-xs">{item.title}</span>
                  </div>
                  <div className="mt-2 text-xl font-semibold">{item.value}</div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
                  </div>
                  <div className="mt-1 text-right text-xs text-muted-foreground">{item.pct}%</div>
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary"
                    onClick={() => onUsageAction(item.action)}
                  >
                    {item.action}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold">Workspace Settings</h3>
              <p className="mt-1 text-sm text-muted-foreground">Manage your workspace preferences.</p>
              <div className="mt-4 space-y-2">
                {[
                  { icon: Globe, title: "General Settings", desc: "Update workspace name, timezone and preferences" },
                  { icon: Lock, title: "Security", desc: "Manage security settings and session controls" },
                  { icon: Shield, title: "Data & Privacy", desc: "Manage retention and privacy settings" },
                  { icon: Link2, title: "Integrations", desc: "Manage connected apps and integrations" },
                ].map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-lg border bg-background p-3 text-left"
                    onClick={() =>
                      notify(
                        "success",
                        `${item.title} page coming soon`,
                      )
                    }
                  >
                    <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold text-red-700">Danger Zone</h3>
              <p className="mt-1 text-sm text-muted-foreground">Irreversible and destructive actions.</p>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-left"
                  onClick={() => setTransferOpen(true)}
                >
                  <Workflow className="mt-0.5 h-4 w-4 text-red-600" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-red-700">Transfer Ownership</div>
                    <div className="text-xs text-red-600/80">
                      Transfer workspace ownership to another member
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-red-500" />
                </button>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-left"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mt-0.5 h-4 w-4 text-red-600" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-red-700">Delete Workspace</div>
                    <div className="text-xs text-red-600/80">
                      Permanently delete workspace and all data
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Workspace Activity</h3>
                <button
                  type="button"
                  className="text-xs font-medium text-primary"
                  onClick={() => router.push("/team/activity")}
                >
                  View All Activity
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {MOCK_WORKSPACE_ACTIVITY.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg border bg-background p-3">
                    {item.type === "invite" ? (
                      <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    ) : item.type === "role" ? (
                      <UserCog className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    ) : item.type === "wa" ? (
                      <MessageCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <WandSparkles className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm">{item.text}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <CalendarDays className="mr-1 inline h-3 w-3" />
                        {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
      </div>

      {editOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5">
            <h4 className="text-base font-semibold">Edit Workspace</h4>
            <div className="mt-4 space-y-3">
              <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Workspace Name" />
              <Input value={draftTimezone} onChange={(e) => setDraftTimezone(e.target.value)} placeholder="Timezone" />
              <Input value={draftCountry} onChange={(e) => setDraftCountry(e.target.value)} placeholder="Country" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!draftName || !draftTimezone || !draftCountry) {
                    return notify("error", "All workspace fields are required");
                  }
                  setWorkspace((prev) => ({ ...prev, name: draftName, timezone: draftTimezone, country: draftCountry }));
                  setEditOpen(false);
                  notify("success", "Workspace updated");
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {transferOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5">
            <h4 className="text-base font-semibold">Transfer Ownership</h4>
            <p className="mt-1 text-sm text-muted-foreground">Select member to become the new owner.</p>
            <select
              className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={transferOwnerId}
              onChange={(e) => setTransferOwnerId(e.target.value)}
            >
              {MOCK_TEAM_MEMBERS.filter((m) => m.status !== "invited").map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTransferOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const selected = MOCK_TEAM_MEMBERS.find((m) => m.user_id === transferOwnerId);
                  if (!selected) return notify("error", "Selected member not found");
                  setWorkspace((prev) => ({ ...prev, ownerId: selected.user_id, ownerName: selected.name }));
                  setTransferOpen(false);
                  notify("success", `Ownership transferred to ${selected.name}`);
                }}
              >
                Confirm Transfer
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5">
            <h4 className="text-base font-semibold text-red-700">Delete Workspace</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Type <span className="font-semibold">DELETE</span> to enable delete button.
            </p>
            <Input className="mt-3" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={deleteText !== "DELETE"}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteText("");
                  notify("success", "Mock delete confirmed. Workspace not deleted.");
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
