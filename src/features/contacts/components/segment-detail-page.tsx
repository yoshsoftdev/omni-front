"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Pencil, X } from "lucide-react";

import { ColorDot } from "@/components/shared/color-dot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { SegmentAnalyticsPanel } from "@/features/contacts/components/segments/segment-analytics";
import { SegmentRuleBuilder } from "@/features/contacts/components/segments/segment-rule-builder";
import { MOCK_SEGMENTS } from "@/features/contacts/mock-data";
import { useToast } from "@/hooks/use-toast";
import type { ContactSegment } from "@/types/segment";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function SegmentDetailPage({ segmentId }: { segmentId: string }) {
  const { notify, Toast } = useToast();
  const initial = MOCK_SEGMENTS.find((s) => s.id === segmentId) ?? MOCK_SEGMENTS[0];
  const [segment, setSegment] = useState<ContactSegment>({ ...initial, rules: [...initial.rules] });
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(segment.name);
  const [description, setDescription] = useState(segment.description);

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
        <Button variant="outline" onClick={() => { setName(segment.name); setDescription(segment.description); setEditOpen(true); }}>
          <Pencil className="mr-2 h-4 w-4" />Edit Segment
        </Button>
      </div>
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-semibold">Segment Rules</h3>
        <div className="mt-4">
          <SegmentRuleBuilder rules={segment.rules} onChange={(rules) => setSegment({ ...segment, rules })} />
        </div>
      </section>
      <SegmentAnalyticsPanel />
      {editOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Edit Segment</h3><button type="button" onClick={() => setEditOpen(false)}><X className="h-4 w-4" /></button></div>
            <div className="space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={() => { setSegment({ ...segment, name: name.trim(), description: description.trim(), updated_at: new Date().toISOString() }); setEditOpen(false); notify("success", "Segment updated"); }}>Save</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
