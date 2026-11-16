"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { SegmentTable } from "@/features/contacts/components/segments/segment-table";
import { segmentService } from "@/features/segments/services/segment.service";
import { usePermission } from "@/features/team/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { PERM } from "@/lib/permissions";
import type { ContactSegment } from "@/types/segment";
import { formatApiErrorMessage } from "@/services/api/errors";

export function SegmentsListPage() {
  const { notify, Toast } = useToast();
  const { can } = usePermission();
  const [segments, setSegments] = useState<ContactSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const sorted = useMemo(() => [...segments].sort((a, b) => a.name.localeCompare(b.name)), [segments]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    segmentService
      .list()
      .then(setSegments)
      .catch((err) => setLoadError(formatApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [notify, attempt]);

  async function handleCreate() {
    if (!name.trim()) return notify("error", "Segment name is required");
    try {
      const created = await segmentService.create({
        name: name.trim(),
        description: description.trim(),
      });
      setSegments((prev) => [created, ...prev]);
      setCreateOpen(false);
      setName("");
      setDescription("");
      notify("success", "Segment created");
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <Toast />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">Manage your contact database, segments, and tags.</p>
      </div>
      <ContactsNav />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Segments</h2>
          <p className="text-sm text-muted-foreground">Dynamic audiences based on saved filter rules.</p>
        </div>
        {can(PERM.contactCreate) ? (
          <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Segment</Button>
        ) : null}
      </div>
      <section className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <EmptyState message="Loading segments..." className="m-4" />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={() => setAttempt((n) => n + 1)} className="m-4" />
        ) : sorted.length === 0 ? (
          <EmptyState message="No segments found." className="m-4" />
        ) : (
          <SegmentTable
            segments={sorted}
            onDelete={can(PERM.contactDelete) ? (id) => (id ? setDeleteId(id) : notify("error", "Segment id is missing")) : undefined}
          />
        )}
      </section>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Create Segment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input aria-label="Segment name" placeholder="Segment Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input aria-label="Description" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete segment?"
        description="The segment is removed; its contacts are kept."
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await segmentService.remove(deleteId);
            setSegments((prev) => prev.filter((segment) => segment.id !== deleteId));
            notify("success", "Segment deleted");
          } catch (err) {
            notify("error", formatApiErrorMessage(err));
          }
        }}
      />
    </div>
  );
}
