"use client";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { QuickReplyFormModal } from "@/features/settings/components/quick-reply-form-modal";
import { SettingsNav } from "@/features/settings/components/settings-nav";
import { quickReplyService } from "@/features/settings/services/quick-reply.service";
import type { QuickReply } from "@/features/settings/types/quick-reply";
import { usePermission } from "@/features/team/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { PERM } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";
import { formatApiErrorMessage } from "@/services/api/errors";

export function QuickRepliesPage() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const { notify, Toast } = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const { can } = usePermission();
  const [items, setItems] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuickReply | null>(null);
  const [category, setCategory] = useState("General");
  const [content, setContent] = useState("");

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.category.localeCompare(b.category) || a.content.localeCompare(b.content)),
    [items],
  );

  useEffect(() => {
    if (!canManage) {
      router.replace("/inbox");
      return;
    }
    setLoading(true);
    setLoadError(null);
    quickReplyService
      .list()
      .then(setItems)
      .catch((error) => setLoadError(formatApiErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [canManage, notify, router, attempt]);

  function openCreate() {
    setEditing(null);
    setCategory("General");
    setContent("");
    setModalOpen(true);
  }

  function openEdit(item: QuickReply) {
    setEditing(item);
    setCategory(item.category);
    setContent(item.content);
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!content.trim()) {
      notify("error", "Content is required");
      return;
    }
    try {
      if (editing) {
        const updated = await quickReplyService.update(editing.id, {
          category: category.trim() || "General",
          content: content.trim(),
        });
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        notify("success", "Quick reply updated");
      } else {
        const created = await quickReplyService.create({
          category: category.trim() || "General",
          content: content.trim(),
        });
        setItems((prev) => [created, ...prev]);
        notify("success", "Quick reply created");
      }
      setModalOpen(false);
    } catch (error) {
      notify("error", formatApiErrorMessage(error));
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirm({ title: "Delete quick reply?", description: "Agents can no longer insert it from the inbox." }))) return;
    try {
      await quickReplyService.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      notify("success", "Quick reply deleted");
    } catch (error) {
      notify("error", formatApiErrorMessage(error));
    }
  }

  if (!canManage) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Toast />
      {confirmDialog}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage workspace shortcuts for your team inbox.</p>
      </div>
      <SettingsNav />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Quick Replies</h2>
          <p className="text-sm text-muted-foreground">
            Create canned responses with variables. Agents can use them in inbox with `/` or the Template button.
          </p>
        </div>
        {can(PERM.quickReplyCreate) ? (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Quick Reply
          </Button>
        ) : null}
      </div>
      <section className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <EmptyState message="Loading quick replies..." className="m-4" />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={() => setAttempt((n) => n + 1)} className="m-4" />
        ) : sorted.length === 0 ? (
          <EmptyState message="No quick replies yet." className="m-4" />
        ) : (
          <DataTable className="">
              <DataTableHead>
                <DataTableRow>
                  <DataTableHeaderCell>Category</DataTableHeaderCell>
                  <DataTableHeaderCell>Content</DataTableHeaderCell>
                  <DataTableHeaderCell>Actions</DataTableHeaderCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {sorted.map((item) => (
                  <DataTableRow key={item.id} className="hover:bg-muted/40">
                    <DataTableCell className="align-top">{item.category}</DataTableCell>
                    <DataTableCell className="align-top whitespace-pre-wrap text-muted-foreground">{item.content}</DataTableCell>
                    <DataTableCell className="align-top">
                      <div className="flex items-center gap-1">
                        {can(PERM.quickReplyUpdate) ? (
                          <Button variant="ghost" size="sm" aria-label="Edit quick reply" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {can(PERM.quickReplyDelete) ? (
                          <Button variant="ghost" size="sm" aria-label="Delete quick reply" onClick={() => void handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : null}
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
        )}
      </section>
      <QuickReplyFormModal
        open={modalOpen}
        title={editing ? "Edit Quick Reply" : "Create Quick Reply"}
        category={category}
        content={content}
        onCategoryChange={setCategory}
        onContentChange={setContent}
        onClose={() => setModalOpen(false)}
        onSubmit={() => void handleSubmit()}
        submitLabel={editing ? "Update" : "Create"}
      />
    </div>
  );
}
