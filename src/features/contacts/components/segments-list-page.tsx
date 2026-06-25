"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { SegmentTable } from "@/features/contacts/components/segments/segment-table";
import { segmentService } from "@/features/segments/services/segment.service";
import { useToast } from "@/hooks/use-toast";
import type { ContactSegment } from "@/types/segment";

export function SegmentsListPage() {
  const { notify, Toast } = useToast();
  const [segments, setSegments] = useState<ContactSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const sorted = useMemo(() => [...segments].sort((a, b) => a.name.localeCompare(b.name)), [segments]);

  useEffect(() => {
    segmentService
      .list()
      .then(setSegments)
      .catch((err) => notify("error", err instanceof Error ? err.message : "Failed to load segments"))
      .finally(() => setLoading(false));
  }, [notify]);

  function handleCreate() {
    notify("error", "Create segment via API is not wired in this view yet.");
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
        <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Segment</Button>
      </div>
      <section className="rounded-xl border bg-card shadow-sm">
        {loading ? (
          <EmptyState message="Loading segments..." className="m-4" />
        ) : sorted.length === 0 ? (
          <EmptyState message="No segments found." className="m-4" />
        ) : (
          <SegmentTable segments={sorted} onDelete={() => notify("error", "Delete segment via API is not wired yet.")} onMore={() => notify("success", "More actions")} />
        )}
      </section>
      {createOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Create Segment</h3><button type="button" onClick={() => setCreateOpen(false)}><X className="h-4 w-4" /></button></div>
            <div className="space-y-3">
              <Input placeholder="Segment Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate}>Create</Button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
