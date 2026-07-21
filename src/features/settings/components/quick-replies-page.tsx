"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { QuickReplyFormModal } from "@/features/settings/components/quick-reply-form-modal";
import { SettingsNav } from "@/features/settings/components/settings-nav";
import { quickReplyService } from "@/features/settings/services/quick-reply.service";
import type { QuickReply } from "@/features/settings/types/quick-reply";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";

export function QuickRepliesPage() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const canManage = role === "owner" || role === "admin";
  const { notify, Toast } = useToast();
  const [items, setItems] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
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
    quickReplyService
      .list()
      .then(setItems)
      .catch((error) => notify("error", error instanceof Error ? error.message : "Failed to load quick replies"))
      .finally(() => setLoading(false));
  }, [canManage, notify, router]);

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
      notify("error", error instanceof Error ? error.message : "Failed to save quick reply");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this quick reply?")) return;
    try {
      await quickReplyService.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      notify("success", "Quick reply deleted");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Failed to delete quick reply");
    }
  }

  if (!canManage) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Toast />
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
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quick Reply
        </Button>
      </div>
      <section className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <EmptyState message="Loading quick replies..." className="m-4" />
        ) : sorted.length === 0 ? (
          <EmptyState message="No quick replies yet." className="m-4" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Content</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="p-4 align-top font-medium">{item.category}</td>
                    <td className="p-4 align-top whitespace-pre-wrap text-muted-foreground">{item.content}</td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
