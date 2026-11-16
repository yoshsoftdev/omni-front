"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";

import { ColorDot } from "@/components/shared/color-dot";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { SegmentRuleBuilder } from "@/features/contacts/components/segments/segment-rule-builder";
import { segmentService } from "@/features/segments/services/segment.service";
import { usePermission } from "@/features/team/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { PERM } from "@/lib/permissions";
import type { ContactSegment } from "@/types/segment";
import { formatApiErrorMessage, isNotFound } from "@/services/api/errors";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function SegmentDetailPage({ segmentId }: { segmentId: string }) {
  const { notify, Toast } = useToast();
  const [segment, setSegment] = useState<ContactSegment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [rulesDirty, setRulesDirty] = useState(false);
  const canUpdate = usePermission().can(PERM.contactUpdate);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    segmentService
      .getById(segmentId)
      .then((data) => {
        if (!data) {
          setSegment(null);
          return;
        }
        setSegment({ ...data, rules: [...data.rules] });
        setRulesDirty(false);
        setName(data.name);
        setDescription(data.description);
      })
      .catch((err) => (isNotFound(err) ? setSegment(null) : setLoadError(formatApiErrorMessage(err))))
      .finally(() => setLoading(false));
  }, [segmentId, attempt]);

  async function save(input: Parameters<typeof segmentService.update>[1]): Promise<boolean> {
    setSaving(true);
    try {
      const saved = await segmentService.update(segmentId, input);
      setSegment({ ...saved, rules: [...saved.rules] });
      setRulesDirty(false);
      notify("success", "Segment saved");
      return true;
    } catch (err) {
      notify("error", formatApiErrorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <EmptyState message="Loading segment..." className="m-8" />;
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={() => setAttempt((n) => n + 1)} className="m-8" />;
  }

  if (!segment) {
    return <EmptyState message="Segment not found." className="m-8" />;
  }

  return (
    <div className="space-y-6">
      <Toast />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">Manage your contact database, segments, and tags.</p>
      </div>
      <ContactsNav />
      <Link href="/contacts/segments" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />Back to Segments
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ColorDot color={segment.color} className="h-3 w-3" />
            <h2 className="text-xl font-semibold">{segment.name}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{segment.description}</p>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>{segment.contact_count.toLocaleString()} contacts</span>
            <span>Last updated {formatDate(segment.updated_at)}</span>
          </div>
        </div>
{canUpdate ? (
        <Button variant="outline" onClick={() => { setName(segment.name); setDescription(segment.description); setEditOpen(true); }}>
          <Pencil className="mr-2 h-4 w-4" />Edit Segment
        </Button>
        ) : null}
      </div>
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-semibold">Segment Rules</h3>
        <div className="mt-4">
          <SegmentRuleBuilder
            readOnly={!canUpdate}
            rules={segment.rules}
            onChange={(rules) => {
              setSegment({ ...segment, rules });
              setRulesDirty(true);
            }}
          />
        </div>
        {rulesDirty ? (
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setAttempt((n) => n + 1)}>
              Discard changes
            </Button>
            <Button disabled={saving} onClick={() => void save({ rules: segment.rules })}>
              {saving ? "Saving..." : "Save rules"}
            </Button>
          </div>
        ) : null}
      </section>
      <Dialog open={editOpen} onOpenChange={(next) => !saving && setEditOpen(next)}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Segment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input aria-label="Segment name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input aria-label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={saving || !name.trim()}
              onClick={() => void save({ name: name.trim(), description: description.trim() }).then((ok) => ok && setEditOpen(false))}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
